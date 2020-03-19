import json
import os

import decimal
import bson
import itertools

import datetime
import numpy
from numpy.ma import MaskedArray
from numpy.ma.core import MaskedConstant
from pymongo import ASCENDING

from cybele_advanced_query_builder.settings import DATASET_DIR
from aggregator.models import Dataset as AgDataset, Variable as AgVariable, Dimension as AgDimension


class BaseVariable(object):
    name = ''
    title = ''
    unit = None

    def to_json(self):
        return {
            'name': self.name,
            'title': self.title,
            'unit': self.unit,
        }


class Dimension(BaseVariable):
    min = None
    max = None
    step = 1
    values = None
    axis = None

    def to_json(self):
        document = super(Dimension, self).to_json()

        document.update({
            'min': self.min,
            'max': self.max,
            'step': self.step,
            'values': self.values,
            'axis': self.axis,
        })

        return encode_document(document)


class Variable(BaseVariable):
    scale_factor = 1
    add_offset = 0
    cell_methods = []
    dimensions = []
    type_of_analysis = None
    extra_info = {}

    def to_json(self):
        document = super(Variable, self).to_json()

        document.update({
            'scale_factor': self.scale_factor,
            'add_offset': self.add_offset,
            'cell_methods': self.cell_methods,
            'type_of_analysis': self.type_of_analysis,
            'extra_info': self.extra_info,
            'dimensions': self.dimensions,
        })

        return encode_document(document)


class DatasetInfo(object):
    title = ''
    source = ''
    description = ''
    references = []

    def to_json(self):
        return encode_document({
            'title': self.title,
            'source': self.source,
            'description': self.description,
            'references': self.references,
        })


def encode_document(obj):
    for key in obj.keys():
        if isinstance(obj[key], numpy.integer):
            obj[key] = int(obj[key])
        elif isinstance(obj[key], numpy.floating):
            obj[key] = float(obj[key])
        elif isinstance(obj[key], numpy.ndarray):
            obj[key] = obj[key].tolist()

    return obj


class BaseConverter(object):
    name = None
    _dataset = None
    _variables = []
    _dimensions = []
    _data = []
    MAX_DOCUMENT_SIZE = 16000000 # 16M limit on BSON documents
    AVERAGE_ELEMENT_SIZE = 16

    @property
    def dataset(self):
        raise NotImplementedError('`dataset` getter was not implemented')

    @property
    def variables(self):
        raise NotImplementedError('`variables` getter was not implemented')

    @property
    def dimensions(self):
        raise NotImplementedError('`dimensions` getter was not implemented')

    def variable_iter(self, v_name):
        raise NotImplementedError('`variable_iter` optional method is not implemented')

    def data(self, v_name):
        raise NotImplementedError('variable data getter was not implemented')

    def count(self, v_name):
        total = 1
        dt = self.data(v_name)
        while True:
            try:
                total *= len(dt)
                dt = dt[0]
            except:
                break

        return total

    def get_value(self, v_name, comb):
        value = self.data(v_name=v_name)
        for idx, _ in enumerate(comb):
            try:
                value = value[comb[idx][0]]
            except IndexError:
                raise ValueError('Could not get value for this combination')

        if type(value) is MaskedConstant:
            return None

        if str(value) == '--':
            return None

        return value

    def normalize(self, dimension, value):
        # default normalization changes nothing
        return value

    def get_variable(self, v_name):
        try:
            return [v for v in self.variables if v.name == v_name][0]
        except IndexError:
            return None

    def get_dimension(self, d_name):
        try:
            return [d for d in self.dimensions if d.name == d_name][0]
        except IndexError:
            return None

    @staticmethod
    def full_input_path(filename=None):
        source_path = os.path.join(DATASET_DIR, 'source')
        if not os.path.isdir(source_path):
            os.mkdir(source_path)

        if filename is None:
            return source_path

        return os.path.join(source_path, filename)

    @staticmethod
    def full_output_path(filename=None):
        dist_path = os.path.join(DATASET_DIR, 'dist')
        if not os.path.isdir(dist_path):
            os.mkdir(dist_path)

        if filename is None:
            return dist_path

        return os.path.join(dist_path, filename)

    def store(self, target, stdout=None, update_dataset=None):
        """
        :param target: Either {'type': 'postgres', 'cursor': <Cursor>, 'withIndices': True|False} or
                              {'type': 'mongo', 'db': <MongoClient>}
        :param stdout: Optional output stream
        :param update_dataset: Existing dataset to update
        :return: Inserts data to database
        """

        def insert(iv):
            if target['type'] == 'postgres':
                target['cursor'].execute('INSERT INTO %s VALUES %s;' % (agv.data_table_name, ','.join(iv)))
            elif target['type'] == 'mongo':
                target['db'][v.name].insert_many(iv)

        def postgres_serialize(val):
            if type(val) == datetime.datetime:
                return "TIMESTAMP '%s'" % val.isoformat().replace('T', ' ')
            else:
                return str(val)

        if 'type' not in target:
            raise ValueError('Target type is required')

        if target['type'] not in ['postgres', 'mongo']:
            raise ValueError('Unsupported store target type')

        agd = None

        # add datasets, variables & their dimensions
        try:
            # get or create dataset
            if update_dataset is not None:
                agd = update_dataset
            elif target['type'] == 'postgres':

                agd = AgDataset.objects.create(title=self.dataset.title, source=self.dataset.source,
                                               description=self.dataset.description, references=self.dataset.references)
            elif target['type'] == 'mongo':
                agd = target['db'].datasets.insert(self.dataset.to_json())

            for v in self.variables:
                print v.name

                v_existed = False
                # get or create variable
                if target['type'] == 'postgres':
                    try:
                        agv = AgVariable.objects.get(name=v.name, dataset=agd)
                        v_existed = True
                    except AgVariable.DoesNotExist:
                        agv = AgVariable.objects.create(name=v.name, title=v.title, unit=v.unit,
                                                        scale_factor=v.scale_factor, add_offset=v.add_offset,
                                                        cell_methods=v.cell_methods, type_of_analysis=v.type_of_analysis,
                                                        dataset=agd)
                elif target['type'] == 'mongo':
                    v_doc = v.to_json()
                    v_doc['dataset_id'] = agd
                    agv = target['db'].variables.insert(v_doc)
                    # TODO get variable for updating dataset

                dimensions = []
                for dimension_name in v.dimensions:
                    for d in self.dimensions:
                        if d.name == dimension_name:
                            if target['type'] == 'postgres':
                                try:
                                    agdim = AgDimension.objects.get(name=d.name, variable=agv)
                                except AgDimension.DoesNotExist:
                                    agdim = AgDimension.objects.create(name=d.name, title=d.title, unit=d.unit,
                                                                       min=decimal.Decimal(str(d.min)) if d.min is not None else None,
                                                                       max=decimal.Decimal(str(d.max)) if d.max is not None else None,
                                                                       step=decimal.Decimal(str(d.step))
                                                                       if d.step is not None else None,
                                                                       axis=d.axis,
                                                                       variable=agv)

                            elif target['type'] == 'mongo':
                                d_doc = d.to_json()
                                d_doc['variable_id'] = agv
                                agdim = target['db'].dimensions.insert(d_doc)

                            dimensions.append(d)
                            break

                # create data table for variable
                if not v_existed:
                    if target['type'] == 'postgres':
                        agv.create_data_table(cursor=target['cursor'], with_indices=False)

                # add data
                try:
                    _iter = self.variable_iter(v.name)
                except NotImplementedError:

                    dim_values = []
                    for dimension in dimensions:
                        if dimension.values:
                            dim_values.append([(k, x) for k, x in enumerate(dimension.values)])
                            continue

                        vv = []
                        x = dimension.min
                        idx = 0
                        while (dimension.step < 0 and x >= dimension.max) or \
                                ((dimension.step >= 0 or dimension.step is None) and x <= dimension.max):
                            vv.append((idx, self.normalize(dimension, x)))
                            if dimension.step is None:
                                break
                            idx += 1
                            x += dimension.step
                        dim_values.append(vv)

                    _iter = itertools.product(*dim_values)

                insert_values = []
                progress = 0
                total = self.count(v_name=v.name)

                for comb in _iter:
                    error = False
                    value = None

                    try:
                        if comb[-1][1] != 'V':
                            raise ValueError()
                        value = comb[-1][0]
                        comb = comb[:-1]
                    except ValueError:
                        try:
                            value = self.get_value(v_name=v.name, comb=comb)
                        except ValueError:
                            error = True

                    progress += 1
                    if progress % 1000 == 0:
                        if stdout:
                            stdout.write("\r Adding data... %d%%" % (progress * 100 / total), ending='')
                            stdout.flush()
                        else:
                            print('%d%%' % (progress * 100 / total))

                    if error or (value is None):
                        continue

                    if target['type'] == 'postgres':
                        insert_values.append('(%s)' % ','.join([postgres_serialize(combi[1]) for combi in comb] +
                                                               [str(value)]))
                    elif target['type'] == 'mongo':
                        val_doc = {}
                        for idx, combi in enumerate(comb):
                            val_doc[dimensions[idx].name] = combi[1]

                        val_doc['value'] = value
                        insert_values.append(encode_document(val_doc))

                    if len(insert_values) == 1000:
                        insert(insert_values)
                        insert_values = []

                if insert_values:
                    insert(insert_values)
                    insert_values = []

                if target['type'] == 'mongo':
                    if 'with_indices' in target and target['with_indices']:
                        for d in dimensions:
                            target['db'][v.name].create_index([(d.name, ASCENDING)])
                elif target['type'] == 'postgres':
                    # update value distributions
                    agv.update_distribution(cursor=target['cursor'])

                    # create indices
                    if 'with_indices' in target and target['with_indices'] and not v_existed:
                        agv.create_indices(cursor=target['cursor'])

                if stdout:
                    stdout.write("\r Completed\t\t\t", ending='\n')
                    stdout.flush()
                else:
                    print('completed')

            return agd
        except:
            # if agd and type(agd) == AgDataset:
            #     agd.delete()

            raise

from optparse import make_option
from uuid import uuid4

from django.core.management.base import BaseCommand
from django.db import connection

from aggregator.connectors.motu.client import motu_download
from aggregator.converters.base import BaseConverter
from aggregator.converters.netcdf4 import NetCDF4Converter
from cybele_advanced_query_builder.settings_management.development_dpap import COPERNICUS_SERVER
from mongo_client import get_mongo_db


class Command(BaseCommand):
    help = 'Import dataset from copernicus to postgres'
    option_list = BaseCommand.option_list + (
        make_option(
            "-s",
            "--script",
            dest="script",
            help="Copernicus script",
            metavar="SCRIPT"
        ),
        make_option(
            "-t",
            "--target",
            dest="target",
            help="Where data should be stored (either `postgres` or `mongo`)",
            metavar="TARGET"
        ),
    )

    def handle(self, *args, **options):
        target = options['target']
        target_dict = {
            'type': 'postgres',
            'cursor': connection.cursor(),
            'with_indices': False
        }

        if target == 'mongo':
            target_dict = {
                'type': 'mongo',
                'db': get_mongo_db()
            }

        motu_args = (
            COPERNICUS_SERVER['USERNAME'],
            COPERNICUS_SERVER['PASSWORD'],
            BaseConverter.full_input_path(),
            '%s.nc' % str(uuid4()),
        )

        motu_script = options['script']
        # '-m http://data.ncof.co.uk/motu-web/Motu -s NORTHWESTSHELF_ANALYSIS_FORECAST_BIO_004_002_b -d MetO-NWS-BIO-dm-ATTN -x -19.888889312744 -X 12.999670028687 -y 40.066669464111 -Y 65.001251220703 -t "2017-05-14 12:00:00" -T "2017-05-18 12:00:00" -z 0 -Z 3.0001 -v attn '

        print('Downloading...')
        motu_download(('-u %s -p %s ' +
                       motu_script +
                       ' -o "%s" -f %s') % motu_args)
        print('Done.\n')

        cnv = NetCDF4Converter(motu_args[3])
        cnv.store(target=target_dict, stdout=self.stdout)


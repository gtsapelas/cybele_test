from django.core.management.base import BaseCommand, CommandError
from aggregator.models import *
from django.conf import settings
import time


class Command(BaseCommand):
    help = 'generate_dummy_dataset'


    def handle(self, *args, **options):
        dummy_dataset = 'Dummy Dataset'
        dummy_variables = ['CYBELE_CODE', 'CYBELE_NAME', 'CYBELE_NUMBER']
        dummy_dimensions = []


        d = Dataset()
        d.title = dummy_dataset
        d.source = ''
        d.description = ''
        d.stored_at = 'CYBELE_LXS'
        d.table_name = 'HELLO_CYBELE'
        d.publisher = ''
        d.save()
        
        for dv in dummy_variables:
            v = Variable()
            v.dataset = d
            v.name = dv
            v.title = dv
            v.unit = ''
            v.save()
            for dim in dummy_dimensions:
                dim = Dimension()
                dim.variable = v
                dim.name = dim
                dim.title = dim
                dim.unit = ''
                dim.save()



        self.stdout.write(self.style.SUCCESS('Successfully generated dummy dataset'))

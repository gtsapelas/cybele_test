# Generated by Django 3.0.4 on 2020-03-18 22:27

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('aggregator', '0025_auto_20200318_2154'),
    ]

    operations = [
        migrations.AlterField(
            model_name='datasetaccessrequest',
            name='creation_date',
            field=models.DateTimeField(default=datetime.datetime(2020, 3, 18, 22, 27, 3, 862570)),
        ),
    ]

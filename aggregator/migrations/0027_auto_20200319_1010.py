# Generated by Django 3.0.4 on 2020-03-19 10:10

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('aggregator', '0026_auto_20200318_2227'),
    ]

    operations = [
        migrations.AlterField(
            model_name='datasetaccessrequest',
            name='creation_date',
            field=models.DateTimeField(default=datetime.datetime(2020, 3, 19, 10, 10, 0, 296020)),
        ),
    ]

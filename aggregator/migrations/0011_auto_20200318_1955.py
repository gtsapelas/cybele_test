# Generated by Django 3.0.4 on 2020-03-18 19:55

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('aggregator', '0010_auto_20200318_1639'),
    ]

    operations = [
        migrations.AlterField(
            model_name='datasetaccessrequest',
            name='creation_date',
            field=models.DateTimeField(default=datetime.datetime(2020, 3, 18, 19, 55, 40, 387848)),
        ),
    ]

# Generated by Django 3.0.3 on 2020-03-18 16:30

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('aggregator', '0006_auto_20200318_1624'),
    ]

    operations = [
        migrations.AlterField(
            model_name='datasetaccessrequest',
            name='creation_date',
            field=models.DateTimeField(default=datetime.datetime(2020, 3, 18, 16, 30, 57, 7194)),
        ),
    ]

# Generated by Django 3.0.4 on 2020-03-19 10:21

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('aggregator', '0029_auto_20200319_1020'),
    ]

    operations = [
        migrations.AlterField(
            model_name='datasetaccessrequest',
            name='creation_date',
            field=models.DateTimeField(default=datetime.datetime(2020, 3, 19, 10, 21, 58, 799268)),
        ),
    ]

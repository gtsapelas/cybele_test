# Generated by Django 3.0.4 on 2020-03-18 19:55

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('query_designer', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='abstractquery',
            name='user',
            field=models.ForeignKey(default=None, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='queries', to=settings.AUTH_USER_MODEL),
        ),
    ]

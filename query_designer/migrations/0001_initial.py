# Generated by Django 3.0.3 on 2020-02-17 14:50

from django.conf import settings
import django.contrib.postgres.fields.jsonb
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='AbstractQuery',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.TextField(default='Untitled query')),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('updated', models.DateTimeField(auto_now=True)),
                ('generated_by', models.CharField(choices=[('CUSTOM', 'Custom query'), ('QDv1', 'Query Designer (old)'), ('QDv2', 'Query Designer (new)')], max_length=32)),
                ('document', django.contrib.postgres.fields.jsonb.JSONField()),
                ('design', django.contrib.postgres.fields.jsonb.JSONField(blank=True, default=None, null=True)),
                ('v2_fields', models.TextField(blank=True, default=None, editable=False, null=True)),
                ('v2_filters', models.TextField(blank=True, default=None, editable=False, null=True)),
                ('count', models.IntegerField(blank=True, default=None, null=True)),
                ('headers', django.contrib.postgres.fields.jsonb.JSONField(blank=True, default=None, null=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='queries', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Query',
            fields=[
                ('abstractquery_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='query_designer.AbstractQuery')),
            ],
            bases=('query_designer.abstractquery',),
        ),
        migrations.CreateModel(
            name='TempQuery',
            fields=[
                ('abstractquery_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='query_designer.AbstractQuery')),
                ('original', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='query_designer.Query')),
            ],
            bases=('query_designer.abstractquery',),
        ),
    ]

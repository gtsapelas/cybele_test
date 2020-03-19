from django.conf.urls import url, include
from django.contrib.auth.decorators import login_required

import query_designer.views as views

urlpatterns = [
    # api
    url('datasets/$', views.datasets),
    url('datasets/(?P<dataset_id>[\w-]+)/variables/$', views.dataset_variables),
    url('datasets/(?P<dataset_id>[\w-]+)/variables/(?P<variable_id>[\w-]+)/properties/$', views.dataset_variable_properties),
    url('datasets/(?P<dataset_id>[\w-]+)/variables/(?P<variable_id>[\w-]+)/count/$', views.count_variable_values),
    # url('list/$', views.queries),

    # formulas
    url('^formulas/save/$', views.save_formulas, name='save-formula'),
    url('^formulas/delete/$', views.delete_formula, name='delete-formula'),
    url('^formulas/$', views.formulas, name='formula-editor'),

    # execute
    url('execute/$', views.execute_query, name='execute-query'),
    url('execute/(?P<pk>\d+)/$', views.execute_query, name='execute-query'),

    # load
    url('load/(?P<pk>\d+)/$', views.load_query, name='load-query'),

    # delete
    url('delete/(?P<pk>\d+)/$', views.delete_query, name='delete-query'),

    # save
    url('save/(?P<temp>\d+)/$', views.save_query, name='save-query'),
    url('save/(?P<pk>\d+)/(?P<temp>\d+)/$', views.save_query, name='save-query'),

    # get select variables
    url('get_query_variables/$', views.get_query_variables, name='get-query-variables'),

    # load new query to analysis
    url('load_to_analysis/$', views.load_to_analysis, name='load-to-analysis'),

    # simplified
    url('simplified/$', views.simplified, name='simplified'),
    url('simplified/config/$', views.get_config, name='config'),
    url('simplified/(?P<pk>\d+)/$', views.simplified, name='simplified'),
    url('simplified/filter-info/(?P<filter_type>[\w-]+)/(?P<pk>\d+)/$', views.filter_info, name='filter-info'),

    url('simplified/list/$', views.list_queries, name='list-queries'),

    url('^simplified/open/(?P<pk>\w+)/$', views.open_chart, name='open-chart'),

    # new query designer template
    url('new_template/$', views.new_template, name='new_template'),


    # url('clean/$', views.clean, name='clean'),

    # basic page
    url('$', views.clean, name='clean'),
]

import os
# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
import uuid

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get("SECRET_KEY")

# SECURITY WARNING: don't run with debug turned on in production!
# DEBUG = int(os.environ.get("DEBUG", default=0))
DEBUG = True

ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS").split(" ")


# Application definition
INSTALLED_APPS = [
    # django
    'rest_framework',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.humanize',
    'django.contrib.sites',

    # visualisation
    'leaflet',

    # authentication
    'allauth',
    'allauth.account',
    'allauth.socialaccount',

    # apps
    'aggregator',
    'query_designer',
]


STORAGE_TARGET = 'CYBELE_LXS'
DATABASES = {
    'default': {
        'ENGINE': os.environ.get("SQL_ENGINE"),
        'NAME': os.environ.get("SQL_DATABASE"),
        'USER': os.environ.get("SQL_USER"),
        'PASSWORD': os.environ.get("SQL_PASSWORD"),
        'HOST': os.environ.get("SQL_HOST"),
        'PORT': os.environ.get("SQL_PORT"),
    },
    'CYBELE_LXS': {
        'HOST': os.environ.get("LXS_HOST"),
        'PORT': os.environ.get("LXS_PORT"),
        'USER': os.environ.get("LXS_USER"),
        'PASSWORD': os.environ.get("LXS_PASSWORD"),
        'NAME': os.environ.get("LXS_NAME"),
    }
}



AUTHENTICATION_BACKENDS = (
    # Needed to login by username in Django admin, regardless of `allauth`
    "django.contrib.auth.backends.ModelBackend",
    # `allauth` specific authentication methods, such as login by e-mail
    "allauth.account.auth_backends.AuthenticationBackend",
)

SITE_ID = 1
LOGIN_REDIRECT_URL = '/queries/'

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django.middleware.cache.UpdateCacheMiddleware',
    'django.middleware.cache.FetchFromCacheMiddleware',

]

LOGIN_EXEMPT_URLS = (
    r'^$',
	r'^terms/$',
    r'^about$',
    r'^register$',
    r'^accounts/',
)

ROOT_URLCONF = 'cybele_advanced_query_builder.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates'), os.path.join(BASE_DIR, 'templates', 'allauth')]
        ,
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'django_settings_export.settings_export',
            ],
        },
    },
]

WSGI_APPLICATION = 'cybele_advanced_query_builder.wsgi.application'

PLATFORM_VERSION = '0.1.0'
SETTINGS_EXPORT = [
    'PLATFORM_VERSION',
]


# AUTH_PASSWORD_VALIDATORS = [
#     # {
#     #     'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
#     # },
#     {
#         'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
#     },
#     # {
#     #     'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
#     # },
#     {
#         'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
#     },
# ]

# ACCOUNT_EMAIL_REQUIRED = True
# ACCOUNT_UNIQUE_EMAIL = True
# ACCOUNT_EMAIL_VERIFICATION = 'mandatory'


# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_L10N = True
USE_TZ = True

DATETIME_FORMAT = 'Y-m-d H:i:s'
DATE_FORMAT = 'Y-m%d'

STATIC_URL = '/static/'
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, "static"),
]

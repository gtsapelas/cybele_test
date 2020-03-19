Installation of Cybele's Advanced Query Builder using docker and docker-compose

To run the development environment:
 - Go to .env/dev directory:
    - rename .env_app_dev.template to .env_app_dev 
    - rename .env_db_dev.template to .env_db_dev
 - Add your own configuration to both files
 - At the base directory execute:
    - docker-compose -f docker-compose-dev.yml  build
    - docker-compose -f docker-compose-dev.yml  up
 - visit http://localhost:8000/queries/


To run the production environment:
 - Go to .env/prod directory and rename .env_app_prod.template to .env_app_prod and .env_db_prod.template to .env_db_prod
 - Add your own configuration to both files
 - At the base directory execute:
    - docker-compose -f docker-compose-prod.yml  build
    - docker-compose -f docker-compose-prod.yml  up
 - visit http://localhost/queries/ 


Files to be modified to support the multi-label

# setup
modules/ProjectAdministration/static/sql/create_schema.sql
- add new table into schema mapping between annotation and label. And not image and label. Annotation is an object mapping the user, the image and the label together. + other properties.    

# frontend
* Make the annotation.label property an array
* set; 
  * support multiple label for the save image
  * saving the list of images and their respective annotation; pass it to the backend. 
* get; 
  * reading the list of images and their respective annotation; read it from the backend. 
* display; display multiple label somehow
  * style to be defined
 
http://206.12.94.82:8080/static/interface/js/dataHandler.js?v=2.0.210531
modules/LabelUI/static/js/dataHandler.js
	
http://206.12.94.82:8080/static/interface/js/dataEntry.js?v=2.0.210531
modules/LabelUI/static/js/dataEntry.js
	
http://206.12.94.82:8080/static/interface/js/annotationPrimitives.js?v=2.0.210531
modules/LabelUI/static/js/annotationPrimitives.js

http://206.12.94.82:8080/static/interface/js/renderPrimitives.js?v=2.0.210531
modules/LabelUI/static/js/renderPrimitives.js

# backend
modules/LabelUI/backend/middleware.py
modules/LabelUI/backend/annotation_sql_tokens.py
- set 
- get

# database
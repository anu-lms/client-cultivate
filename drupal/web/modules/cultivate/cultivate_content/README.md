We import/export dummy content with Default content module, 
see more information: https://www.drupal.org/docs/8/modules/default-content

## Export
Update content on the site and run by drush:
`drush --user=1 dcer ENTITY_TYPE ENTITY_ID --folder=modules/cultivate/cultivate_content/content`

Examples:
`drush --user=1 dcer node 3 --folder=modules/cultivate/cultivate_content/content`

## Import
Enable `cultivate_content` module, it will import content from `./cultivate_content/content` folder automatically.

## Notes
We use `better_normalizers` module to keep exported files in base64 format.

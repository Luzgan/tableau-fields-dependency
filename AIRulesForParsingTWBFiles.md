Most important parts of the structure for our parsing:

- Workbook
  - Datasources
    - Datasource (can be multiple)
      - Column (can be multiple)
      - Connection
        - Relation
          - Columns
            - Columns (can be multiple)

There are multiple type of columns we want to track: parameters, calculations and data source fields.

_Parameters:_
Parameters can be only read from columns directly within datasource which has name "Parameters".
For parameter attributes we care mostly about: caption, name, role, datatype
Since those are read directly from column tag - their name is wrapped in []

_Calculations:_
Calculations can be found directly within any datasource (I think Parameters one is an exception, but lets assume that they can be anywhere.)
Calculation can be recognized by having additional tag underneath called calculation.
For calculations attributes we care mostly about: caption, name, role, datatype and formula that is on calculation tag.
Since those are read directly from column tage - their name is wrapped in []

_Data source fields:_
Those are hardest fields to read. Because they don't exists as a column directly within datasource UNLESS user (or tableau during import of datasource) did any changes to the original field. Those changes can be renaming (adding caption), converting to measure and different operations like that. Therefore logic for reading those files should be: read then directly from columns within relations and then look into the columns directly under the same datasource, to look for user overwrites. IMPORTANT - columns in relation have only two important fields - datatype and name. Name read from column under relation has to be additionally wrapped in [], since those are not naturally. Role has to be read based on the conversion table below. And only then we can look for overwrites, based on a name (wrapped in []).

Default role type depending on datatype:

- integer: measure
- real: measure
- string: dimension
- date: dimension
- datetime: dimension
- boolean: dimension

_Exceptions that we ignore for now:_
If we find a datasource, where datasource -> connection -> relation(type="pivot"), then we are ignoring that datasource.
For now, we will only treat the files that have only one level of relation.

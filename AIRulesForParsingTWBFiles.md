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

When parsing field references from calculation formulas, we need to handle:

1. Comments:
   - Single-line comments starting with `//`
   - Multi-line comments between `/*` and `*/`
2. Quoted strings:
   - Both single (`'`) and double (`"`) quotes
   - Can span multiple lines
   - Can contain escaped quotes (`\'` and `\"`)
3. Processing order is crucial:
   - First remove all comments
   - Then remove all quoted strings
   - Finally parse remaining text for field references
4. Field references format:
   - Simple: `[Field Name]`
   - With datasource: `[Datasource].[Field Name]`
5. Edge cases in field references:
   - Field names can contain spaces and special characters
   - Field names are case-sensitive
   - Datasource names must be wrapped in square brackets
   - Field names must be wrapped in square brackets
   - References can appear multiple times in the same formula
   - References can be part of larger expressions

_Data source fields:_
Data source fields can be defined in multiple ways (and usually are repeated) in the TWB file, and we need to handle all of them:

1. Column Mappings (ds.connection.cols.map):

   - Maps a field name to a column in a relation
   - Format: `[Relation].[Field]`
   - Used when fields are renamed or transformed
   - Example: `[Orders].[Customer Name] -> [Customer]`

2. Direct Relation Columns (ds.connection.relation.columns.column):

   - Original columns from the data source
   - Contains basic info: name and datatype
   - Names need to be wrapped in [] when used
   - Role is determined by datatype

3. Metadata Records (ds.connection["metadata-records"]["metadata-record"]):

   - Additional metadata about columns
   - Class "column" contains type information
   - Can override or supplement existing column info
   - Contains: local-name, local-type

4. Direct Datasource Columns (ds.column):
   - User modifications to original columns
   - Can contain: caption, name, role, datatype
   - Used for field customizations

Processing order is important:

1. First read from relations
2. Then apply column mappings
3. Then apply metadata records
4. Finally apply direct column modifications (user changes)

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

_Additional Notes:_

- Field names in references must be wrapped in square brackets `[]`
- Datasource names in qualified references must also be wrapped in square brackets
- The order of processing (comments -> quotes -> references) is important to avoid false positives
- All text processing should be done before attempting to parse references

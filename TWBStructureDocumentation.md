# Tableau Workbook (.twb) File Structure Documentation

## Overview

A Tableau workbook (.twb) file is an XML document that contains definitions for data sources, calculated fields, parameters, and other workbook elements. This document outlines the key structures we handle in our parser.

## Root Structure

```xml
<workbook>
  <datasources>
    <datasource name="...">
      <!-- Datasource content -->
    </datasource>
  </datasources>
</workbook>
```

## Column Types and Their Handling

### 1. Parameters

- Found in datasource named "Parameters"
- Structure:
  ```xml
  <column name="[Parameter Name]" datatype="..." role="...">
    <calculation formula="..."/>
  </column>
  ```
- Attributes we track:
  - name (wrapped in [])
  - caption
  - role
  - datatype

### 2. Calculations

- Can be in any datasource
- Structure:
  ```xml
  <column name="[Calculation Name]" datatype="..." role="...">
    <calculation formula="..."/>
  </column>
  ```
- Attributes we track:
  - name (wrapped in [])
  - caption
  - role
  - datatype
  - formula (from calculation tag)

### 3. Data Source Fields

These are the most complex as they can be defined in multiple ways (and usually are repeated) in the TWB file:

#### a. Column Mappings (ds.connection.cols.map)

```xml
<connection>
  <cols>
    <map key="[Field Name]" value="[Relation].[Field]"/>
  </cols>
</connection>
```

- Maps a field name to a column in a relation
- Used when fields are renamed or transformed
- Example: `[Orders].[Customer Name] -> [Customer]`

#### b. Direct Relation Columns (ds.connection.relation.columns.column)

```xml
<relation>
  <columns>
    <column name="Field Name" datatype="..."/>
  </columns>
</relation>
```

- Original columns from the data source
- Contains basic info: name and datatype
- Names need to be wrapped in [] when used
- Role is determined by datatype

#### c. Metadata Records (ds.connection["metadata-records"]["metadata-record"])

```xml
<metadata-records>
  <metadata-record class="column">
    <local-name>Field Name</local-name>
    <local-type>...</local-type>
  </metadata-record>
</metadata-records>
```

- Additional metadata about columns
- Class "column" contains type information
- Can override or supplement existing column info

#### d. Direct Datasource Columns (ds.column)

```xml
<column name="[Field Name]" datatype="..." role="..."/>
```

- User modifications to original columns
- Can contain: caption, name, role, datatype
- Used for field customizations

### Processing Order for Data Source Fields

1. First read from relations
2. Then apply column mappings
3. Then apply metadata records
4. Finally apply direct column modifications (user changes)

## Field References in Calculations

### Reference Format

- Simple: `[Field Name]`
- With datasource: `[Datasource].[Field Name]`

### Special Cases in Formula Parsing

1. Comments:

   - Single-line: `// comment`
   - Multi-line: `/* comment */`

2. Quoted Strings:

   - Single quotes: `'string'`
   - Double quotes: `"string"`
   - Can span multiple lines
   - Can contain escaped quotes: `\'` and `\"`

3. Processing Order:

   1. Remove all comments
   2. Remove all quoted strings
   3. Parse remaining text for field references

4. Edge Cases:
   - Field names can contain spaces and special characters
   - Field names are case-sensitive
   - References can appear multiple times
   - References can be part of larger expressions

## Exceptions We Handle

### Pivot Relations

- If a datasource has a relation with `type="pivot"`, we ignore that datasource

### Role Determination

Default role based on datatype:

- integer: measure
- real: measure
- string: dimension
- date: dimension
- datetime: dimension
- boolean: dimension

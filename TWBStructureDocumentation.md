# Tableau Workbook (.twb) File Structure Documentation

## Overview

A Tableau workbook (.twb) file is an XML document that contains definitions for data sources, calculated fields, parameters, and other workbook elements. This document outlines the key structures found in TWB files.

## Root Structure

A Tableau workbook file follows this XML structure:

```xml
<?xml version='1.0' encoding='utf-8' ?>
<workbook original-version='18.1' source-build='...' source-platform='...' version='18.1' xmlns:user='...'>
  <!-- Document format changes -->
  <document-format-change-manifest>
    <feature1 />
    <feature2 />
    <!-- ... -->
  </document-format-change-manifest>

  <!-- Optional repository location -->
  <repository-location derived-from='...' id='...' path='...' revision='...' />

  <!-- UI preferences -->
  <preferences>
    <preference name='...' value='...' />
  </preferences>

  <!-- Optional styles -->
  <style>
    <style-rule element='...'>
      <format attr='...' value='...' />
    </style-rule>
  </style>

  <!-- Data sources section - always present -->
  <datasources>
    <datasource name='...' version='18.1'>
      <!-- Datasource content -->
    </datasource>
    <!-- More datasources... -->
  </datasources>

  <!-- Other workbook elements... -->
</workbook>
```

### Required Workbook Attributes

- `original-version` - Original version of Tableau that created the workbook
- `version` - Current version of the workbook
- `source-build` - Build number of Tableau that last modified the workbook
- `source-platform` - Platform where the workbook was last modified (win/mac)

### Optional Workbook Attributes

- `xml:base` - Base URL for the workbook
- `include-phone-layouts` - Whether phone layouts are included
- `xmlns:user` - XML namespace for user elements

### Required Sections

1. `<document-format-change-manifest>` - List of format changes and features
2. `<preferences>` - UI and workbook preferences
3. `<datasources>` - Data source definitions

### Optional Sections

1. `<repository-location>` - Information about workbook location in repository
2. `<style>` - Workbook style definitions

## Recognition Rules

### How to Identify Parameters

1. Name Pattern:

   - Always starts with `[Parameters].`
   - Example: `[Parameters].[Parameter Name]`

2. XML Structure:

   - Has `param-domain-type` attribute
   - Usually contains a `<calculation>` element with default value
   - May contain `<members>` for list parameters

3. Unique Attributes:
   - Must have `param-domain-type` (e.g., "list", "range")
   - Often has `allowable-values` attribute

Example:

```xml
<column caption="Year Parameter"
        datatype="integer"
        name="[Parameters].[Year]"
        param-domain-type="range"
        role="measure"
        type="quantitative">
  <calculation class="tableau" formula="2023"/>
  <range max="2025" min="2020" />
</column>
```

### How to Identify Calculated Fields

1. XML Structure:

   - Always has a `<calculation>` child element
   - The `<calculation>` element has a non-empty `formula` attribute
   - Does NOT have `param-domain-type` attribute

2. Formula Characteristics:

   - Contains references to other fields in square brackets
   - May contain functions, operators, or conditional logic
   - Often includes mathematical or logical operations

3. Unique Attributes:
   - Has `class="tableau"` in the calculation element
   - Formula references other fields or parameters

Example:

```xml
<column datatype="real"
        name="[Profit Ratio]"
        role="measure"
        type="quantitative">
  <calculation class="tableau"
              formula="[Profit]/[Sales]"/>
</column>
```

### How to Identify Data Source Fields

1. XML Structure:

   - Simple `<column>` element
   - No `<calculation>` child element
   - Often has `<remote-name>` and `<local-name>`

2. Unique Attributes:

   - Has `remote-type` and `local-type`
   - Contains `remote-alias` matching the source data
   - Often has `ordinal` attribute indicating column position

3. Additional Characteristics:
   - Usually found within `<relation>/<columns>` structure
   - Has source database metadata
   - Contains attributes about the original data source

Example:

```xml
<column>
  <remote-name>Sales</remote-name>
  <remote-type>131</remote-type>
  <local-name>[Sales]</local-name>
  <parent-name>[Data Source]</parent-name>
  <remote-alias>Sales</remote-alias>
  <ordinal>5</ordinal>
  <local-type>real</local-type>
  <aggregation>Sum</aggregation>
  <contains-null>true</contains-null>
</column>
```

## Quick Reference Table

| Feature             | Parameter               | Calculated Field        | Data Source Field        |
| ------------------- | ----------------------- | ----------------------- | ------------------------ |
| Name Pattern        | `[Parameters].*`        | Any valid name          | Matches source column    |
| Has `<calculation>` | Yes (default value)     | Yes (formula)           | No                       |
| Special Attributes  | `param-domain-type`     | `class="tableau"`       | `remote-type`, `ordinal` |
| Formula Type        | Simple default value    | Complex expressions     | None                     |
| Location            | Top level in datasource | Any worksheet/dashboard | Within relation columns  |
| References          | Standalone              | Other fields/parameters | Original data source     |

## Formula Patterns

### Parameter Formulas

1. Simple Default Values:

   - Single literal value: `"2023"`, `"Default"`, `1.0`
   - No calculations or field references
   - Often wrapped in quotes for strings

2. Parameter References in Other Formulas:
   - Referenced as: `[Parameters].[Parameter Name]`
   - Used in conditions: `IF [Parameters].[Year] = 2023 THEN...`
   - Used in calculations: `[Value] * [Parameters].[Multiplier]`

### Calculated Field Formulas

1. Mathematical Operations:

   ```
   [Revenue] / [Units]
   SUM([Sales]) / SUM([Quantity])
   [Price] * [Quantity] * (1 - [Discount])
   ```

2. Conditional Logic:

   ```
   IF [Sales] > 1000 THEN "High" ELSE "Low" END
   CASE [Category]
     WHEN "A" THEN 1
     WHEN "B" THEN 2
     ELSE 0
   END
   ```

3. Date Functions:

   ```
   DATEADD('month', 1, [Order Date])
   DATEDIFF('day', [Start Date], [End Date])
   DATETRUNC('quarter', [Date])
   ```

4. Aggregations:
   ```
   SUM([Quantity]) / WINDOW_SUM(SUM([Quantity]))
   RUNNING_AVG(SUM([Sales]))
   {FIXED [Category] : SUM([Sales])}
   ```

### Data Source Field References

1. Direct References:

   - Simple field name: `[Field Name]`
   - No calculations or transformations
   - Used in source queries and joins

2. Metadata References:
   ```xml
   <remote-name>Field Name</remote-name>
   <local-name>[Field Name]</local-name>
   <remote-alias>Field Name</remote-alias>
   ```

## Field Type Decision Tree

To determine field type, follow these steps:

1. Check the name:

   - If starts with `[Parameters].` → Parameter
   - Otherwise, continue to step 2

2. Look for `<calculation>` element:

   - If absent → Data Source Field
   - If present, continue to step 3

3. Check for `param-domain-type`:

   - If present → Parameter
   - If absent → Calculated Field

4. Examine formula complexity:
   - Simple literal → Likely Parameter
   - Complex expression → Calculated Field
   - No formula → Data Source Field

## 1. Data Source Fields

### Location

Data source fields are defined within the `<datasources>` section, under individual `<datasource>` elements.

### Structure

```xml
<datasources>
  <datasource name="Source Name">
    <connection>
      <relation>
        <columns>
          <column>
            <!-- Field definition -->
          </column>
        </columns>
      </relation>
    </connection>
  </datasource>
</datasources>
```

### Required Attributes

- `name` - The name of the field
- `datatype` - The data type (e.g., real, string, integer)
- `role` - The field's role (e.g., measure, dimension)
- `type` - The type of field (e.g., quantitative, nominal)

### Optional Attributes

- `caption` - Display name for the field
- `aggregation` - Default aggregation (Sum, Avg, etc.)
- `precision` - For numeric fields
- `scale` - For decimal numbers
- `semantic-role` - Special semantic meaning (e.g., [City].[Name])

## 2. Calculated Fields

### Location

Calculated fields appear as `<column>` elements with a `<calculation>` child element.

### Structure

```xml
<column datatype="type" name="[Calculated Field Name]" role="measure/dimension" type="quantitative/nominal">
  <calculation class="tableau" formula="calculation formula">
    <!-- Formula definition -->
  </calculation>
</column>
```

### Required Attributes

- `name` - The name of the calculated field
- `datatype` - The resulting data type
- `formula` - The calculation formula
- `class` - Usually "tableau"

### Optional Attributes

- `caption` - Display name
- `role` - Measure or dimension
- `type` - Quantitative or nominal

## 3. Parameters

### Location

Parameters are defined in the `<datasources>` section as special `<column>` elements with parameter attributes.

### Structure

```xml
<column caption="Parameter Name" datatype="type" name="[Parameters].[Parameter Name]" param-domain-type="domain" role="measure/dimension" type="quantitative/nominal">
  <calculation class="tableau" formula="parameter formula"/>
</column>
```

### Required Attributes

- `name` - Must start with [Parameters].
- `datatype` - The parameter's data type
- `param-domain-type` - The type of domain (list, range, etc.)

### Optional Attributes

- `caption` - Display name
- `role` - Measure or dimension
- `type` - Quantitative or nominal

## Common Data Types

- `real` - Floating point numbers
- `integer` - Whole numbers
- `string` - Text values
- `boolean` - True/false values
- `date` - Date values

## Common Roles

- `measure` - Numeric values that can be aggregated
- `dimension` - Categorical or grouping values

## Notes

1. Fields can have additional metadata like formatting, aliases, and comments
2. Calculated fields can reference other fields and parameters
3. Parameters can have default values and allowable ranges
4. Field names in formulas are typically enclosed in square brackets
5. Aggregation attributes determine how measures are combined (SUM, AVG, etc.)

## Common Patterns and Edge Cases

### Parameter Patterns

1. Common Use Cases:

   - Date/Time selectors
   - Filter values
   - Calculation toggles
   - Display options

2. Typical Structures:

   ```xml
   <!-- List Parameter -->
   <column name="[Parameters].[Category Filter]" param-domain-type="list">
     <members>
       <member value="All"/>
       <member value="Electronics"/>
       <member value="Furniture"/>
     </members>
   </column>

   <!-- Range Parameter -->
   <column name="[Parameters].[Year Selector]" param-domain-type="range">
     <range min="2020" max="2025"/>
   </column>
   ```

### Calculated Field Patterns

1. Common Use Cases:

   - Ratios and percentages
   - Running totals
   - Custom groupings
   - Date calculations

2. Typical Structures:

   ```xml
   <!-- Ratio Calculation -->
   <column name="[Profit Ratio]">
     <calculation formula="SUM([Profit])/SUM([Sales])"/>
   </column>

   <!-- Complex Conditional -->
   <column name="[Performance Category]">
     <calculation formula="
       CASE
         WHEN [Sales] > [Target] * 1.1 THEN 'Exceeding'
         WHEN [Sales] >= [Target] THEN 'Meeting'
         ELSE 'Below'
       END
     "/>
   </column>
   ```

### Data Source Field Patterns

1. Common Use Cases:

   - Raw data columns
   - Database fields
   - Joined table columns

2. Typical Structures:

   ```xml
   <!-- Numeric Field -->
   <column>
     <remote-name>Revenue</remote-name>
     <remote-type>131</remote-type>
     <local-type>real</local-type>
     <aggregation>Sum</aggregation>
   </column>

   <!-- Dimension Field -->
   <column>
     <remote-name>Category</remote-name>
     <remote-type>129</remote-type>
     <local-type>string</local-type>
     <aggregation>None</aggregation>
   </column>
   ```

### Edge Cases

1. Calculated Parameters

   - Parameters that use calculations for default values
   - Still identified by `param-domain-type` attribute

   ```xml
   <column name="[Parameters].[Current Year]" param-domain-type="range">
     <calculation formula="YEAR(TODAY())"/>
   </column>
   ```

2. Hybrid Fields

   - Calculated fields that look like parameters
   - Distinguished by lack of `param-domain-type`

   ```xml
   <column name="[Year]">
     <calculation formula="YEAR([Date])"/>
   </column>
   ```

3. Aliased Source Fields
   - Data source fields with calculations
   - Have both `remote-name` and `calculation`
   ```xml
   <column>
     <remote-name>Status</remote-name>
     <calculation formula="UPPER([Status])"/>
   </column>
   ```

### Best Practices for Identification

1. Always Check Multiple Attributes:

   - Don't rely on name alone
   - Verify presence of key attributes
   - Check parent element structure

2. Follow the Decision Tree:

   - Start with name pattern
   - Check for calculations
   - Verify domain type
   - Examine formula complexity

3. Consider Context:
   - Location in workbook
   - Relationship to other fields
   - Usage in visualizations

## Attribute Distribution

### Common Attributes (All Field Types)

These attributes appear in all types of fields (data source, calculated, and parameters):

- `name` - The identifier of the field
- `datatype` - The data type (string, integer, real, etc.)
- `role` - The role in visualizations (measure/dimension)
- `caption` - Display name (optional)

### Data Source Field Specific Attributes

These attributes only appear in data source fields:

- `remote-name` - Original name from the data source
- `remote-type` - Original data type from the source
- `remote-alias` - Alias in the data source
- `ordinal` - Position in the source table
- `aggregation` - Default aggregation type
- `precision` - Numeric precision for numbers
- `contains-null` - Whether nulls are allowed
- `local-type` - Local data type representation

### Calculated Field Specific Attributes

These attributes are specific to calculated fields:

- `default-format` - Display format for the result
- `calculation/formula` - The calculation expression
- `calculation/class` - Always "tableau"

### Parameter Specific Attributes

These attributes only appear in parameters:

- `param-domain-type` - Type of parameter (list/range)
- `members` - List of allowed values (for list parameters)
- `range` - Min/max values (for range parameters)
- `aliases` - Display values for parameter options

#### Parameter Patterns

Common parameter patterns found in TWB files:

1. **Simple List Parameters**

   ```xml
   <column datatype='string' name='[SimpleParam]' param-domain-type='list'>
     <members>
       <member value='value1' />
       <member value='value2' />
     </members>
   </column>
   ```

2. **Aliased List Parameters**

   ```xml
   <column datatype='string' name='[AliasedParam]' param-domain-type='list'>
     <aliases>
       <alias key='value1' value='Display Name 1' />
       <alias key='value2' value='Display Name 2' />
     </aliases>
     <members>
       <member alias='Display Name 1' value='value1' />
       <member alias='Display Name 2' value='value2' />
     </members>
   </column>
   ```

3. **Boolean Parameters**

   ```xml
   <column datatype='boolean' name='[BoolParam]' param-domain-type='list'>
     <members>
       <member value='true' />
       <member value='false' />
     </members>
   </column>
   ```

4. **Range Parameters**
   ```xml
   <column datatype='integer' name='[RangeParam]' param-domain-type='range'>
     <range min='0' max='100' />
   </column>
   ```

### Data Types

Common data types found in TWB files:

- `string` - Text values
- `integer` - Whole numbers
- `real` - Decimal numbers
- `boolean` - True/false values
- `date` - Date values
- `datetime` - Date and time values

### Roles

Common roles found in TWB files:

- `measure` - Numeric values that can be aggregated
- `dimension` - Categorical values used for grouping
- `filter` - Values used for filtering
- `parameter` - User-configurable values

# OpenRally Export Formats

Tulip supports exporting roadbook data in the **OpenRally** format, adhering to the specifications outlined in version 1.0.2. The app provides two export modes: **Strict** and **Undocumented**. This section explains the differences between these modes to help you choose the appropriate option for your needs.

## Strict Mode
When **Strict Mode** is enabled in the app's settings, the exported roadbook data fully complies with the **OpenRally v1.0.2** specification, as defined in the [OpenRally cross-country documentation](https://github.com/openrally/openrally/tree/master/cross-country). This mode ensures compatibility with systems or applications that strictly adhere to the official OpenRally standard.

- **Characteristics**:
  - Exports data strictly according to the OpenRally v1.0.2 schema.
  - Excludes any non-standard or additional attributes not defined in the official specification.
  - Ideal for use with systems that require strict compliance with the OpenRally format.

To enable Strict Mode:
1. Navigate to the app's **Settings** menu.
2. Toggle **Strict Mode** to **On**.

## Undocumented Mode
In **Undocumented Mode**, the app includes additional attributes that are not part of the official OpenRally v1.0.2 specification. These extra attributes provide enhanced functionality but may not be compatible with all systems that expect strict adherence to the standard.

- **Additional Attributes**:
  - The **`neutralization`** element includes the following attributes:
    - **`open`**: Specifies the opening details for the neutralization zone.
    - **`clear`**: Indicates the clearing or exit details for the neutralization zone.
  - The **`dt`** element includes:
    - **`time`**: Provides a time attribute for additional timing information.

- **Use Case**:
  - Choose Undocumented Mode if your target system supports or can safely ignore these additional attributes.
  - Note that using this mode may result in compatibility issues with systems that strictly validate against the OpenRally v1.0.2 schema.

## Choosing the Right Mode
- Use **Strict Mode** if:
  - You are exporting data for a system that requires full compliance with OpenRally v1.0.2.
  - Compatibility with standard OpenRally parsers is critical.
- Use **Undocumented Mode** if:
  - Your system or workflow can utilize the additional `open`, `clear`, and `time` attributes.
  - You are working with custom or extended implementations of the OpenRally format.

## Additional Resources
For more details on the OpenRally format, refer to the official documentation at [https://github.com/openrally/openrally/tree/master/cross-country](https://github.com/openrally/openrally/tree/master/cross-country).
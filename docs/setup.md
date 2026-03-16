# Application settings

## Google Maps API Integration in Tulip

Tulip leverages the Google Maps API to provide powerful and accurate mapping capabilities for planning and visualizing rally routes. To ensure seamless functionality and cost efficiency, Tulip currently uses a proxy server that provides access to Google Maps using a pre-configured API key. This setup allows users to start using the mapping features immediately without needing to configure their own API key.

However, to offer greater flexibility and help reduce potential costs associated with the proxy server, we encourage users who are familiar with the Google Cloud Platform to set up and use their own Google Maps API key. By doing so, you can directly manage your API usage and ensure uninterrupted access to mapping services, especially if the proxy service is scaled down or discontinued in the future.

### How to Set Up Your Own Google Maps API Key
If you’re comfortable with the process, follow these steps to obtain and configure your own Google Maps API key:

1. **Create a Google Cloud Account**:
   - Visit the [Google Cloud Console](https://console.cloud.google.com/) and sign in or create a new account.
   - Set up a billing account, as Google Maps API usage may incur charges based on your usage.

2. **Create a New Project**:
   - In the Google Cloud Console, create a new project for Tulip.
   - Enable the necessary APIs (e.g., Maps JavaScript API, Directions API) under **APIs & Services > Library**.

3. **Generate an API Key**:
   - Navigate to **APIs & Services > Credentials** and click **Create Credentials > API Key**.
   - Restrict the key to specific APIs (e.g., Maps JavaScript API) and add application restrictions (e.g., HTTP referrers) for security.

4. **Configure Tulip with Your API Key**:
   - Open Tulip’s settings menu.
   - Locate the Google Maps API configuration section.
   - Enter your API key and save the settings.

For detailed instructions, refer to the [Google Maps Platform Documentation](https://developers.google.com/maps/documentation).

### Continuing with the Proxy Server
If you prefer not to set up your own API key, you can continue using the proxy server provided by Tulip. However, please note that this service may be subject to usage limits or discontinuation in the future to manage operational costs. We recommend transitioning to your own API key for a more reliable and personalized experience.

By using your own Google Maps API key, you contribute to the sustainability of Tulip while gaining greater control over your mapping experience. 

## Settings

### Application Settings
- **Open last roadbook**: Automatically opens the most recently edited roadbook when launching Tulip, streamlining your workflow for ongoing projects.

### Custom glyph path
Select the path for custom glyphs. All images in this path will be available under **User glyphs**

**Note:** When sharing a roadbook file also share the custom glyphs used.

### Tulip settings
- **Tulip close distance (m)**: Defines the distance threshold (in meters) for considering next instruction as "close." The default is 300 meters, adjustable to match your rally’s precision requirements.
- **Show CAP heading**: Controls the default visibility of CAP heading for new instructions in the roadbook.
- **Show coordinates**: Determines whether geographic coordinates are displayed by default for new instructions in the roadbook. 
- **Coordinates Format**: Allows you to choose from three coordinate display formats for new instructions when the "Show coordinates" option is enabled. The available formats are:
  - **DD MM SS.SSS**: Displays coordinates in degrees, minutes, and seconds (e.g., 40° 26' 46.123" N), offering high precision for rally navigation and compatibility with standard GPS systems.
  - **DD MM.MMM**: Displays coordinates in degrees and decimal minutes (e.g., 40° 26.768' N), providing a balance of precision and readability.
  - **DD.DDDDD**: Displays coordinates in decimal degrees (e.g., 40.44613° N), ideal for applications requiring a compact, numerical format.
- **OpenRally strict export:** See [OpenRally](openrally.md)

### Map Settings
- **Set current view as home**: Saves the current map view (including zoom level and center point) as the default "home" view. This is useful for users who frequently work within a specific geographic area, enabling quick access to their preferred map perspective.

### Debug Settings
- **Open dev console on start**: Automatically launches the developer console when Tulip starts, allowing advanced users and developers to access logs, troubleshoot issues, or debug the application during use.

## Save Your Changes
After configuring the settings to suit your preferences, be sure to click the **Save** button to apply and store your changes. This ensures that Tulip retains your customized settings for future sessions.

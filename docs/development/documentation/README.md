---
sidebar_navigation:
  title: Documentation
  priority: 983
description: Contribute to the OpenProject documentation
robots: index, follow
keywords: docs, documentation, help, correct typo
---

# Contributing to the OpenProject documentation

The following overview will give you insights into how the documentation is structured, how you can contribute and what needs to be considered when changing something.

| Topic                                             | Content                                                      |
| ------------------------------------------------- | :----------------------------------------------------------- |
| [Structure](#structure)                           | Understand how the documentation is structured and what belongs where. |
| [Wording and formatting](#wording-and-formatting) | Get to know existing guidelines and common examples for formatting and wording. |
| [Contributing](#contributing)                     | Learn how to contribute to the documentation - be it correcting typos or adding sections. |


## Structure

The documentation is structured along different topics or section of the software, respectively:

- Getting started: General overview of OpenProject and introduction to basic features. Apart from the section "Sign in and registration", "My account" and "My page", there will be additional or more extensive information in the User guide.
- User guide: Covers all sections of the software (except from the ones mentioned above) that a non-admin user may have access to. 
- System admin guide: Covers all sections of the software that are accessible via the *Administration* link when clicking on one's avatar.
- FAQ: Contains general frequently asked questions and such that do not really fit elsewhere. Within the other main sections there are additional FAQ pages that focus on the respective topic.
- Enterprise guide: Covers all subscription-related topics for Enterprise on-premises and Enterprise cloud. Information about premium features that come with Enterprise on-premises and Enterprise cloud can be found in User guide and System admin guide.
- Installation and operations guide: Only relevant for on-premises installations of OpenProject (Community Edition and Enterprise on-premises). Covers topics like installation, configuration, operation and upgrading.
- Release notes: Gives an overview of OpenProject releases and their features and bug fixes. More information will be provided in release news on the OpenProject blog.
- Development: Details the development concepts and processes of OpenProject. As OpenProject is Open Source, everyone is invited to contribute. The explanation of feature requests, bug reports and translations can also be found here.
- API documentation: Documentation of the API(s) of OpenProject and e.g. their endpoints.

In each of these main chapters there are several sub-sections with up to two hierarchical levels. The User guide and the System admin guide and structured along the structure of the software. The rest is structured along topics. 
Most parts of the documentation are feature oriented (rather than use case oriented). There will be additional documentation and resources that look at OpenProject more from a "how do I..." perspective.

### Structure within a section

Within a section/chapter, there are a few main elements:

- Meta data for the structure of the documentation and for search engines.
  ![meta-data-documentation](image-20210503104831431.png)
  The title will be shown in the navigation of the documentation. The priority influences the position within a section (the higher the number the further up). The description, "robots" and the key words are meant for search engines.
- A table of contents: With its headers "Topic" and "Content" it gives an overview of the chapter. There's no general rule or agreement on the structure of the description (below "Content"), yet (e.g. "How to ...", "Main features of button X", "How can you ...?").
  The table of contents only contains the main headers (h2) of a chapter or (in a case like [Enterprise guide](../../enterprise-guide)) links to its sub-sections that are not on the same page.
  For short chapters it is not absolutely necessary to add a table of contents. 
  ![example-table-of-contents](image-20210503104238350.png)
- Headers: Put a main header (h1) directly below the meta data of each chapter. There should only be one h1-header per chapter. Structure the chapter with h2- and more headers. At the moment, all headers will be shown on the right hand side of the documentation.
- Links: There are three types of links in the documentation:
  - Links to other chapters: Use relative links. This means that you may have to use (multiple)"../" to link to a higher hierarchical level.
    Example: Linking from this chapter to https://docs.openproject.org/user-guide/work-packages/work-package-table-configuration/#sort-the-work-package-list looks like this: Put the word that should be linked in square brackets, directly followed by round brackets that contain the link. Each "../" brings you up one hierarchical level (in this case we need to reach the level above the User guide). Then you can enter the regular path. As you can see in the example, a combination of links to other chapters and within a chapter ("#sort-...", see below) works. Make sure to spell-check.
    ![example-link](image-20210503111747519.png)
  - Links within a chapter: You can link to headers. The link starts with a hash sign (#) and contains the name of the header with hyphens in-between. The basic formatting is the same as shown above
    Watch out if there are special characters or capitalizations in the header (e.g. "screen-shot" has to be linked as "#screen-shot" whereas "FAQ - frequently" has to be linked as "#faq---frequently" and "highlighting (Premium)" has to be linked as "#highlighting-premium"). Do not put brackets or commas from a header in the link.
  - External links: When linking to e.g. the OpenProject blog or GitHub, use the same link formatting as above. Do not enter the link without this formatting (square brackets, etc.) as it might be understood as a relative link and thus not work properly.
- Screen-shots: To add a screen-shot, paste it into the editor you use or put it in the same folder as the text file you're about to change is. if necessary, link the image it like in the screen-shot below. Add a description (with hyphens).
  ![screenshots-documentation](image-20210503105826872.png)

- Videos: Where possible, the OpenProject team will embed explanatory videos, which can also be found on our YouTube channel.

## Wording and formatting



### Links

Relative links



## Contributing

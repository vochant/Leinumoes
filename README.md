# Leinumoes

English | [简体中文](./README-zh_CN.md) | [日本語](./README-ja.md)

Leinumoes is a lightweight forum system developed based on the [MDUI](https://mdui.org/) frontend library and [Node.js](https://nodejs.org/) backend runtime environment. It aims to provide users with a concise and efficient online communication platform. The system uses Markdown and various extensions for article writing and features simple community functionality, suitable for small personal forums.

## Features

- **User Account Management** Users can register and log in to accounts and edit their information. Basic permission management exists, allowing appointment or removal of administrators, and banning or unbanning users. Invitation-only registration can be enabled as needed.
- **Article Square** Supports viewing pinned articles, latest articles, browsing articles by section, and setting a specific section as an announcement board. Sections support dynamic creation and modification.
- **Article Writing** Supports Markdown syntax and various extensions for writing articles. Direct uploading of images and other attachments while editing articles is not currently supported.
- **Article Interaction** Supports replying to articles or other replies with floor display, and liking or disliking articles.
- **Internal Messaging** Supports sending private messages between users or creating groups, with Markdown syntax support.
- **Site Notifications** Supports sending system notifications to individual users or all users, with built-in interaction notification functionality.
- **User Activities** Supports users posting short, untitled activities, but interaction permissions are limited to oneself, followers, and administrators.
- **Markdown Tool** To bridge the gap between Markdown\*Palettes' built-in preview functionality and Leinumoes' renderer, this tool allows previewing through the server-side Leinumoes renderer.
- **Cloud Storage** Supports users uploading attachments and inserting them using image syntax or file reference syntax. Regular users have single file size limits and total size limits, while administrators have no restrictions.
- **Admin Backend** Administrators can conveniently manage the system through this backend.
- **User Support Center** If users encounter problems, they can resolve them directly on the site.
- **Static Content** Allows describing static pages using JSON on the server side, with the ability to insert HTML in Markdown fragments or directly use HTML fragments without regular restrictions.

## Build

This project does not require building. After cloning, simply complete the dependencies and create the configuration file to use directly.

## Installation

Clone this repository, then run the following installation commands in the project directory.

For \*nix systems:

```bash
npm install
mv config.json.in config.json
```

For Windows systems:

```batch
npm install
ren config.json.in config.json
```

## Configuration

For basic configuration, modify `config.json`. The field meanings are as follows:

- `title` Forum title
- `subtitle` Forum subtitle
- `key` Encryption key
- `port` Server listening port
- `announcement` Announcement section
- `invite` Invitation-only registration
- `no_guest` Disable guest access, enforce login

For error codes and their display names, modify the corresponding fields in `errids.json`.

For static content, create JSON files in the `static/` directory. The filename will be the static page path, and the format should follow the example files in that directory.

For other supported content, please operate in the browser after running.

## Running

Run the following command in the project directory to start the server:

```bash
node index.js
```

After the server starts, visit `http://localhost:<port>` to enter the forum homepage, where `<port>` is the port number configured in `config.json`.

Before making it public, please register a user and keep their password secure. The first registered user will automatically become the super administrator. Normally, there will be only one super administrator for the entire site. Administrators that can be appointed or removed without database operations are regular administrators.

## License

This project is licensed under the MIT License. For details, please refer to the [LICENSE](./LICENSE) file.
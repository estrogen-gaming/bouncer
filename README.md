# bouncer

Grant your users access to restricted channels by interviewing them.

[![CI](https://github.com/aronson/bouncer/actions/workflows/ci.yaml/badge.svg)](https://github.com/aronson/bouncer/actions/workflows/ci.yaml)
[![Publish Container Image](https://github.com/aronson/bouncer/actions/workflows/cd.yaml/badge.svg)](https://github.com/aronson/bouncer/actions/workflows/cd.yaml)

## Installation and Usage

### Docker/Podman/Etc.

Bouncer is [published as a Container image on GitHub Container Registry](https://github.com/aronson/bouncer/pkgs/container/bouncer) and can be run with the following command:

```sh
docker run ghcr.io/aronson/bouncer
```

Bouncer have `config.yaml`, `data` and `logs` mount points on `/app` path, and they can be mounted to a host or a volume with the following command:

```sh
docker run -v /path/to/your/config.yaml:/app/config.yaml:ro -v /path/to/bouncer/data:/app/data -v /path/to/bouncer/logs:/app/logs ghcr.io/aronson/bouncer
```

> [!IMPORTANT]
>
> Since [Containerfile](Containerfile) contains `VOLUME` instruction to set `/app/data` and `/app/logs` volume, we don't recommend changing `logFolder` and `database` configuration options.

### Native Application

Bouncer can be compiled as a native application with `deno compile`. Make sure to use needed permission and unstable flags for successful and working executable.

### Run with Deno

Bouncer can be run with `deno task start`.

## How it Works

> [!NOTE]
>
> Referenced configuration fields and their purposes can be found at [Configuration](#configuration) section.

1. When a user sends a message to a channel they're not yet allowed to, they're given the role with specified
   `pendingInterviewId`.
2. After that, bouncer sends a message to specified `interviewFlagsId` channel to announce moderators about this.
3. When moderators specified with `moderatorId` role id wants to interview a user, they use `/interview` command to
   interview them.
   - There are two types of interview: Text and ID.
4. When a moderator starts to interview a user, they're given the role with specified `ongoingInterviewId` and
   `pendingInterviewId` role gets removed.
5. After the interview, moderators can either `/approve` or `/disapprove` the user.
   1. If user is approved, `ongoingInterviewId` role gets removed, and if they're approved by...
      1. text, they're given a role with specified `nsfwAccessId`.
      2. ID, they're given a role with specified `nsfwVerifiedId`.
   2. If user is disapproved, `ongoingInterviewId` role gets removed.

## Configuration

Bouncer uses [YAML](https://yaml.org) for configuration file.

> [!TIP]
>
> Configuration file path can be specified using `-c` flag when running bouncer.
>
> ```sh
> deno task start -c /my/config/file.yaml
> ```

### Example Configuration

> [!TIP]
>
> Specified config fields below are default values, and can be changed.

> [!TIP]
>
> To get more detailed information about those fields, [src/config.ts](src/config.ts) file can be checked. It contains detailed comments and information about all configuration fields.

```yaml
database: data/db # Folder to save database files in
logFolder: logs # Folder to put log files in
discord:
  token: # Discord bot token
  serverId: # Server id for bot to operate in
  channels:
    interviewsCategoryId: # Category id to put interview channels under
    interviewFlagsId: # Channel id to send marked user messages to
  roles:
    moderatorId: # Role of moderators to ignore marking them
    pendingInterviewId: # Role of users who are marked as pending interview
    ongoingInterviewId: # Role of users who are currently under an ongoing interview
    nsfwAccessId: # Role of the users who are verified by text and have access to NSFW channels
    nsfwVerifiedId: # Role of the users who are verified by ID and have access to special NSFW channels
```

## Development

Bouncer is made using Deno, and least supported version 1.41.0.

Bouncer uses [discord.js](https://discord.js.org) for Discord intereaction, [zod](https://zod.dev) for config schema validation, [zod-validation-error](https://github.com/causaly/zod-validation-error) for pretty zod errors, and [Deno Standard Library](https://deno.land/std) extensively for filesystem, i/o, parsing and many other operations.

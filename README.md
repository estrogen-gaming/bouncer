# bouncer

Grant your users access to NSFW by interviewing them.

[![CI](https://github.com/aronson/bouncer/actions/workflows/ci.yaml/badge.svg)](https://github.com/aronson/bouncer/actions/workflows/ci.yaml)
[![Publish Container Image](https://github.com/aronson/bouncer/actions/workflows/cd.yaml/badge.svg)](https://github.com/aronson/bouncer/actions/workflows/cd.yaml)

## Installation and Usage

### Docker/Podman/Etc.

Bouncer is [published as a Container image on GitHub Container Registry](https://github.com/aronson/bouncer/pkgs/container/bouncer) and can be ran with following command:

```sh
docker run ghcr.io/aronson/bounccer
```

Bouncer have `config.yaml, `data`and`logs`mount points on`/app` path, and they can be mounted to host or a volume with following command:

```sh
docker run -v /path/to/your/config.yaml:/app/config.yaml:r -v /path/to/bouncer/data:/app/data -v /path/to/bouncer/logs:/app/logs ghcr.io/aronson/bouncer
```

### Native Application

Bouncer can be compiled as a native application with `deno compile`. Make sure to use needed permission and unstable flags for successfull and working executable.

### Run with Deno

Bouncer can be ran with `deno task start`.

## How it Works

> [!NOTE]
>
> Referenced configuration fields and their purposes can be found at [Configuration](#configuration) section.

1. When user sends a message to a channel they're not yet allowed to, they're given the role with specified
   `pendingInterviewId`.
2. After that, bouncer sends a message to specified `interviewFlagsId` channel to announce moderators about this.
3. When moderators specified with `moderatorId` role id wants to interview an user, they use `/interview` command to
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

### Example Configuration

> [!TIP]
>
> Specified config fields below are default values, and can be changed.

> [!TIP]
>
> To get more detailed information about those fields, [src/config.ts](src/config.ts) file can be checked. It contains detailed comments and informations about all configuration fields.

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

---
title: Reference Formats
---

Most Taskcluster services make heavy use of JSON schemas for validation of
incoming and outgoing data, whether through APIs or AMQP exchanges. This makes
the external API surface very reliable and consistent, and helps avoid a lot of
bugs and typos.

The use of JSON schemas also makes it very easy to **generate documentation**
for all the external interfaces offered by Taskcluster components, as done on
this site. To further simplify the generation of documentation and API-clients
we have formalized formats for describing interfaces.

This document describes the formats in which references for API end-points and
AMQP exchanges are documented. This is useful for **automatic generation** of:

 * Documentation
 * Client libraries
 * Dummy mock servers

**Note**, these formats are not completely stable and may change over time, or
merge into one.

## Reference Manifest

All services are linked in http://references.taskcluster.net/manifest.json.
The file contains links to API references (`api.json`) and to exchange
references (`exchanges.json`).  When a service provides both, the latter
generally has an "Events" suffix in the name.

The format of these files is given below.

## API References

Our API end-points all have a simple URL made up of a `baseUrl + route` where a
few arguments are substituted into the `route`. The API end-point takes a JSON
entity body as input and returns a JSON entity body. Input is always validated
before it is accepted, and output is validated before it is returned.

This makes it easy to describe the API end-points in JSON with references to
JSON schema files. The reference format looks as follows:

<div data-render-schema="http://schemas.taskcluster.net/base/v1/api-reference.json">
</div>

The JSON schema for the API reference format is
`http://schemas.taskcluster.net/base/v1/api-reference.json` and references are
validated prior to publication.

## AMQP Exchange References

Each service which sends Pulse messages has its exchanges and messages defined
in a reference document with the following format.

<div data-render-schema="http://schemas.taskcluster.net/base/v1/exchanges-reference.json">
</div>

The JSON schema for the exchanges reference format is published at
`http://schemas.taskcluster.net/base/v1/exchanges-reference.json`. Messages are
validated prior to publication.

_Note_: we do **not** recommend validation of messages upon consumption, as
publishers may upgrade the schema in a backwards compatible way in the future.

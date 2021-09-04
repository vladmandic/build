# Dev-Server: Integrated HTTP/HTTPS server with a build platform and file watcher

Early stages, come back later...

## SSL

You can provide your server key and certificate or use provided self-signed ones  
Self-signed certificate was generated using:

```shell
openssl req -x509 -newkey rsa:4096 -nodes -keyout https.key -out https.crt -days 365 -subj "/C=US/ST=Florida/L=Miami/O=@vladmandic"
```

Note: some apps do not work without secure server since browsers enfoce ssl for access to navigator object

## TODO

- serve.defaultFolder
- serve.defaultFile
- run lint/changelog/typedoc/typings from build
- parse tsconfig/typedocoptions

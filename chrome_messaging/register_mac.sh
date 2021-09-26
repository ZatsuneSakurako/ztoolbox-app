#!/bin/bash

cd $(dirname $0)

mkdir -p /Library/Google/Chrome/NativeMessagingHosts
cp eu.gitlab.zatsunenomokou.chromenativebridge.json /Library/Google/Chrome/NativeMessagingHosts

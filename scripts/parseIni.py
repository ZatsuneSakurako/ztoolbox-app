#!/usr/bin/env python

import sys,logging,configparser,json

file=open(sys.argv[1],"r")
config_object = configparser.ConfigParser()
config_object.read_file(file)
file.close()

if 'InternetShortcut' in config_object and 'url' in config_object['InternetShortcut']:
	print(config_object['InternetShortcut']['url'])
	sys.exit(0)


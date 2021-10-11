
up-linked:
	#mkdir -p ./data-linked
	docker-compose -f docker-compose-linked.yml up

up-clean: clean
	mkdir -p ./data-clean
	#cp ../example/flows.json data-clean/
	#(cd data-clean && npm i node-red-dashboard)
	docker-compose -f docker-compose-clean.yml up

clean:
	rm -rf ./data

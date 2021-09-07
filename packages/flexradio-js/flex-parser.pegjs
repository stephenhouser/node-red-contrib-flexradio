{
	function makeTopic(msg) {
        if (!msg || msg.length <= 1) {
        	return null;
        }
        
	    const topic = [];
  		msg.forEach(function(t) {
        	if (typeof t === 'string') {
	           	topic.push(t);
	        }
	    });
    	return topic.join('/');
  	}
    
    function makePayload(msg) {
        if (!msg || msg.length == 0) {
        	return null;
        }
        
        if (msg.length == 1) {
        	return msg[0];
		}
            
    	const payload = {};
        msg.forEach(function(e) {
           	if (Array.isArray(e)) {
            	const key = e[0];
                const name = e[1];
                if (e.length == 3) {
                	if (!(key in payload)) {
                    	payload[key] = {};
                    }
                	payload[key][name] = e[2];
                } else {
                	payload[key] = name;
                }
           	}
        });
        return payload;
    }
}

Start = Message / Status / Response / Handle / Version

Message 'Message' 
	= 'M' message_id:Integer '|' message:.* 
	{ return { type: 'message', 
    			message_id: message_id, 
                payload: message.join('') }; }

Status 'Status' 
	= 'S' client:Hex_String '|' response:Payload
	{ return { type: 'status', 
    			client: client,
                topic: makeTopic(response),
                payload: makePayload(response) };
    }
    
Response 'Response' 
	= 'R' sequence:Integer '|' code: Hex_String '|' response:Payload?
	{ return { type: 'response', 
    			sequence_number: sequence, 
                response_code: code, 
                topic: makeTopic(response),
                payload: makePayload(response) 
		};
    }

Handle 'Handle' 
	= 'H' client:Hex_String 
	{ return { type: 'handle', 
    			client: client }; }
    
Version 'Version' 
	= 'V' version:Version_Number 
	{ return { type: 'version', 
    			version: version }; }

Payload 'Payload' 
	= Profile / Meter / GPS / Info / Version_Info / Space_KV_List

Version_Info "version_info" 
	= &"SmartSDR" m:Hash_KV_List
    { return ['version', ...m]; }

Info 'Info'
	= &'model=' m:Comma_KV_List
    { return ['info', ...m]; }

GPS 'GPS' 
	= 'gps' _ m:Hash_KV_List
	{ return ['gps', ...m]; }

Meter 'Meter' 
	= 'meter' _ m:Hash_KV_List
	{ return ['meter', ...m] ; }

Profile 'Profile' 
	= 'profile' _ t:String _ m:(m:Profile_List / m:Space_KV_List)
	{ return ['profile', t, ...m] ; }
Profile_List 'Profile_List'
	= 'list=' m:Caret_List
	{ return [[ 'list', m ]]; }


Space_KV_List 'Space_KV_List'
	= head:Space_KV_Member tail:(Space_KV_List_Tail)* _?
	{ return [head].concat(tail); }
Space_KV_List_Tail 'Space_KV_List_Tail'
	= _ m:Space_KV_Member
	{ return m; }
Space_KV_Member 'Space_KV_Member'
	= key:Space_KV_Token eq:'='? value:Space_KV_Token?
	{ return eq ? [key, value] : key; }
Space_KV_Token 'Space_KV_Token'
	= chars:[^ =\t]+
	{ return chars.join(''); }

Comma_KV_List 'Comma_KV_List'
	= head:Comma_KV_Member tail:(Comma_KV_List_Tail)* Comma?
	{ return [head].concat(tail); }
Comma_KV_List_Tail 'Comma_KV_List_Tail'
	= Comma m:Comma_KV_Member
	{ return m; }
Comma_KV_Member 'Comma_KV_Member'
	= key:Comma_KV_Token eq:'='? value:Comma_KV_Token?
	{ return eq ? [key, value] : key; }
Comma_KV_Token 'Comma_KV_Token'
	= String_quoted / Comma_KV_Token_unquoted
Comma_KV_Token_unquoted 
	= chars:[^,=]+
	{ return chars.join(''); }

Hash_KV_List 'Hash_KV_List'
	= head:Hash_KV_Member tail:(Hash_KV_List_Tail)* Hash?
	{ return [head].concat(tail); }
Hash_KV_List_Tail 'Hash_KV_List_Tail'
	= Hash m:Hash_KV_Member
	{ return m; }    
Hash_KV_Member 'Hash_KV_Member'
	= key:Hash_KV_Key eq:'='? value:Hash_KV_Token?
	{ return eq ? [...key, value] : key; }
Hash_KV_Key 'Hash_KV_Key'
	= key:Hash_KV_Complex_Key / key:Hash_KV_Token
	{ return [key]; }
Hash_KV_Complex_Key 'Hash_KV_Complex_Key'
	= n:Integer '.' key:Hash_KV_Token
	{ return [n, key]; }
Hash_KV_Token 'Hash_KV_Toksn'
	= chars:[^#=\t]+
	{ return chars.join(''); }
Hash 
	= '#'

Comma_List 
	= head:Comma_Token tail:(Comma_List_Tail)* Comma?
	{ return [head].concat(tail); }
Comma_List_Tail 
	= Comma t:Comma_Token
	{ return t; }
Comma_Token 
	= chars:[^,]+
	{ return chars.join(''); }
Comma 
	= ','

Caret_List 'Caret_List'
	= head:Caret_Token tail:(Caret_List_Tail)* Caret?
	{ return [head].concat(tail); }
Caret_List_Tail 'Caret_List_Tail'
	= Caret m:Caret_Token
	{ return m; }
Caret_Token 'Caret_Token'
	= chars:[^\^]+
	{ return chars.join(''); }
Caret 
	= '^'

Version_Number 'Version_Number' 
	= major:Integer '.' minor:Integer '.' patch:Integer '.' build: Integer
	{ return { 
    	version: major + '.' + minor + '.' + patch + '.' + build,
    	major: major, 
       	minor: minor, 
       	patch: patch, 
       	build: build
		};
	}

String 'String' 
	= String_quoted / String_unquoted

String_unquoted 'String_unquoted'
	= chars:[^ ,#\t\n\r\f]+ 
	{ return chars.join(''); }  
    
String_quoted 'String_quoted'
	= '"' chars:[^"]* '"'
	{ return chars.join(''); }

Hex_String 'Hex_String' 
	= [0-9a-fA-F]+
	{ return text(); }

Integer 'Integer' 
	= [0-9]+ 
	{ return parseInt(text(), 10); }

_ 'whitespace'
  = [ \t\n\r]+
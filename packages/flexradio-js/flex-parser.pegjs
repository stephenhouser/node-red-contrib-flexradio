// https://pegjs.org/online

Start = Message / Status / Response / Handle / Version

Message = "M" message_id:Integer "|" message:String_unbound 
	{ return { type: 'message', message_id: message_id, message: message }; }

Status = "S" client:Hex_String "|" response:Response_Fields
	{ return { type: 'status', client: client, ...response }; }
    
Response = "R" sequence:Integer "|" code: Integer "|" response:Response_Fields
	{ return { type: 'response', sequence_number: sequence, response_code: code, response: response }; }

Handle = "H" client:Hex_String 
	{ return { client: client }; }
    
Version = "V" version:Version_Number 
	{ return { version: version }; }

Response_Fields = Hash_Fields / Comma_Fields / Comma_List / Space_Fields

Comma_List = 
	"ANT" m:Comma_List_Members
    { return m; }

Comma_List_Members = members:(
	head:String
    tail:("," m:String { return m; })*
    	{ return ['ANT' + head, ...tail]; }
	)?
    { return members; }

// --- # delimited payload

Hash_Fields "hash_fields" =
	"meter" ws m:Hash_Members
    { return { meter: m }; }

Hash_Members "hash_members" = members:(
      head:Hash_Member
      tail:(Hash_Sep m:Hash_Member { return m; })*
      {
        const fields = {};        
        [head].concat(tail).forEach(function(element) {
        	if (!(element.num in fields)) {
            	fields[element.num] = {};
            }
	        fields[element.num][element.key] = element.value;
        });

        return fields;
      }
    )? Hash_Sep?
    { return members; }

Hash_Member "hash_member" = num:Hash_Number "." key:Hash_Key "=" value:Hash_Value
	{ return { num: num, key: key, value: value }; }

Hash_Sep = [#]

Hash_Number = [0-9]+ 
	{ return text(); }
    
Hash_Key = [^\.=]+ 
	{ return text(); }
    
Hash_Value = [^#]+ 
	{ return text(); }

// --- Comma delimited payload

Comma_Fields = 
	"model=" m:Comma_Members
    { return m; }

Comma_Members "comma_fields" = members:(
      head:Comma_Member
      tail:(Comma_Sep m:Comma_Member { return m; })*
      {
        const fields = {};
        const new_head = { name: 'model', value: head.name };
        [new_head].concat(tail).forEach(function(element) {
      		fields[element.name] = element.value;
        });

        return fields;
      }
    )?
    { return members; }

Comma_Member "comma_member" = Comma_Value / Comma_Topic

Comma_Value "comma_value" = name:Comma_Word "=" value:String
	{ return { name: name, value: value }; }
    
Comma_Topic "comma_topic" = name:String 
	{ return { name: name }; }

Comma_Sep = [,]+
Comma_Word = [^,=]+ { return text(); }

// --- Space delimited payload

Space_Fields = 
	m:Space_Members
    { return m; }

Space_Members "space_fields" = members:(
      head:Space_Member
      tail:(Space_Sep m:Space_Member { return m; })*
      {
        const fields = {};
        const topic = [];
        
        [head].concat(tail).forEach(function(element) {
        	if ('value' in element) {
          		fields[element.name] = element.value;
            } else {
            	topic.push(element.name);
            }
        });

		const result = {};
        result[topic.join('/')] = fields;
        return result;
      }
    )? Space_Sep?
    { return members !== null ? members: {}; }

Space_Member "field" = Space_Value / Space_Topic

Space_Value "space_value" = name:Space_Word "=" value:Space_Word?
    { return { name: name, value: value };}
    
Space_Topic "space_topic" = name:String 
	{ return { name: name }; }

Space_Sep = [ ]+
Space_Word = [^ =]+ 
	{ return text(); }




Version_Number "version_number" = major:Integer "." minor:Integer "." patch:Integer "." build: Integer
	{ return { 
    	version: major + "." + minor + "." + patch + "." + build,
    	major: major, 
        minor: minor, 
        patch: patch, 
        build: build }; }

Hex_String "hex_string" = ws [0-9a-fA-F]+
	{ return text(); }

Integer "integer" = ws [0-9]+ 
	{ return parseInt(text(), 10); }

ws "whitespace" = [ \t\n\r]*

// ----- Strings -----
String_unbound = .* 
	{ return text(); }

String = String_quoted / String_unquoted

String_unquoted = chars:[^ ,=#\t\n\r\f]+ 
	{ return chars.join(""); }

String_quoted = quotation_mark chars:[^"]* quotation_mark 
	{ return chars.join(""); }

char = unescaped / escape sequence:(
      '"'
	/ "\\"
    / "/"
    / "b" { return "\b"; }
    / "f" { return "\f"; }
    / "n" { return "\n"; }
    / "r" { return "\r"; }
    / "t" { return "\t"; }
    / "u" digits:$(HEXDIG HEXDIG HEXDIG HEXDIG) {
    	return String.fromCharCode(parseInt(digits, 16));
    }
) {
    return sequence; 
}

escape = "\\"
quotation_mark = '"'
unescaped = [^\0-\x1F\x22\x5C]

// ----- Numbers -----

Number "number" = minus? int frac? exp? { 
	return parseFloat(text()); 
}

decimal_point = "." 
digit1_9 = [1-9]
e = [eE]
exp = e (minus / plus)? DIGIT+
frac = decimal_point DIGIT+
int = zero / (digit1_9 DIGIT*)
minus = "-"
plus = "+"
zero = "0"
  
// ----- Core ABNF Rules -----

// See RFC 4234, Appendix B (http://tools.ietf.org/html/rfc4234).
DIGIT  = [0-9]
HEXDIG = [0-9a-f]i

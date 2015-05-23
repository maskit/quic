# quic
A QUIC (Quick UDP Internet Connections) client implementation.

```
$ node index.js
<< Stream [SID: 1, DLEN: 1076]
## QUIC Version negotiated: Q025
>> Ack [H: 2, LO: 0x01]
>> StopWaiting [SE: 0, LUD: 0x00]
>> Stream [SID: 1, DLEN: 231]
## rejected
>> Padding
<< Stream [SID: 1, DLEN: 1272]
<< Ack [H: 2, LO: 0x01]
@@ trying another decrypter
@@ switched (seq 0x02)
>> Ack [H: 6, LO: 0x02]
>> StopWaiting [SE: 0, LUD: 0x00]
>> Stream [SID: 1, DLEN: 230]
## established
>> Padding
<< Stream [SID: 3, DLEN: 30]
[ [ ':method', 'GET' ],
[ ':scheme', 'http' ],
[ ':authority', 'www.google.com' ],
[ ':path', '/' ] ]
<< Ack [H: 6, LO: 0x02]
>> Ack [H: 30, LO: 0x04]
>> StopWaiting [SE: 2, LUD: 0x02]
>> Stream [SID: 3, DLEN: 156]
[ [ ':status', '302' ],
[ 'alternate-protocol', '80:quic,p=0' ],
[ 'cache-control', 'private' ],
[ 'content-length', '261' ],
[ 'content-type', 'text/html; charset=UTF-8' ],
[ 'date', 'Sat, 23 May 2015 06:02:33 GMT' ],
[ 'location',
'http://www.google.co.jp/?gfe_rd=cr&ei=-RdgVfyDGoqg8wft9IGwCA' ],
[ 'server', 'GFE/2.0' ] ]
>> Stream [SID: 5, DLEN: 261]
<HTML><HEAD><meta http-equiv="content-type" content="text/html;charset=utf-8">
<TITLE>302 Moved</TITLE></HEAD><BODY>
<H1>302 Moved</H1>
The document has moved  
<A HREF="http://www.google.co.jp/?gfe_rd=cr&amp;ei=-RdgVfyDGoqg8wft9IGwCA">here</A>.
</BODY></HTML>

<< Ack [H: 14, LO: 0x03]
<< Ack [H: 30, LO: 0x04]
@@ trying another decrypter
@@ switched (seq 0x05)  
>> Ack [H: 254, LO: 0x07]
>> StopWaiting [SE: 30, LUD: 0x1e]
>> ConnectionClose [EC: 25, RL: 0, R: ]
```

# status

- still under development

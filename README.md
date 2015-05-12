# quic
A QUIC client implementation.

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
<< Ack [H: 0, LO: 0x01]
@@ trying another decrypter
@@ switched (seq 0x02)
>> Ack [H: 6, LO: 0x02]
>> StopWaiting [SE: 0, LUD: 0x00]
>> Stream [SID: 1, DLEN: 230]
## established
>> Padding
<< Ping
<< Ack [H: 4, LO: 0x02]
@@ trying another decrypter
@@ switched (seq 0x03)
>> Ack [H: 62, LO: 0x05]
>> StopWaiting [SE: 4, LUD: 0x04]
<< Ack [H: 12, LO: 0x03]
```

# status

- It can receive a SHLO message from Google's server.

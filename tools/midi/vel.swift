import CoreMIDI
import Foundation
setvbuf(stdout, nil, _IONBF, 0)
let n = MIDIGetNumberOfSources()
for i in 0..<n {
  let s = MIDIGetSource(i); var name: Unmanaged<CFString>?
  MIDIObjectGetStringProperty(s, kMIDIPropertyDisplayName, &name)
  print("SOURCE \(i): \(name?.takeRetainedValue() as String? ?? "?")")
}
if CommandLine.arguments.count > 1 && CommandLine.arguments[1] == "list" { exit(0) }
var client = MIDIClientRef(); MIDIClientCreate("velmeter" as CFString, nil, nil, &client)
var port = MIDIPortRef()
MIDIInputPortCreateWithProtocol(client, "in" as CFString, ._1_0, &port) { list, _ in
  for pkt in list.unsafeSequence() {
    let w = pkt.pointee.words.0
    let status = (w >> 16) & 0xF0, note = (w >> 8) & 0x7F, vel = w & 0x7F
    if status == 0x90 && vel > 0 { print("NOTE \(note) VEL \(vel) T \(Date().timeIntervalSince1970)") }
  }
}
for i in 0..<n { MIDIPortConnectSource(port, MIDIGetSource(i), nil) }
print("LISTENING")
RunLoop.main.run()

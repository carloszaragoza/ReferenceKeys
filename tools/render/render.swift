import AVFoundation
func fourCC(_ s:String)->OSType{ s.utf8.reduce(0){($0<<8)|OSType($1)} }
let args=CommandLine.arguments
let stateXML=try! Data(contentsOf: URL(fileURLWithPath: args[1]))
let evs:[(Double,[UInt8])]=try! String(contentsOfFile: args[2], encoding:.utf8).split(separator:"\n").map{ l in let p=l.split(separator:" "); return (Double(p[0])!, p[1...].map{UInt8($0)!}) }
let outPath=args[3]; let wait=Double(args[4]) ?? 20
let desc=AudioComponentDescription(componentType: fourCC("aumu"), componentSubType: fourCC("Kstn"), componentManufacturer: fourCC("GOSW"), componentFlags:0, componentFlagsMask:0)
let sem=DispatchSemaphore(value:0); var unit:AVAudioUnit?
AVAudioUnit.instantiate(with: desc, options: []){u,e in unit=u; if let e=e{print("err",e)}; sem.signal()}
sem.wait()
let au=unit!.auAudioUnit
Thread.sleep(forTimeInterval: 3)
var st=au.fullState!; st["data0"]=stateXML; au.fullState=st
print("state set; waiting \(wait)s for samples"); 
RunLoop.current.run(until: Date().addingTimeInterval(wait))
let sr=48000.0
let eng=AVAudioEngine(); let fmt=AVAudioFormat(standardFormatWithSampleRate: sr, channels: 2)!
eng.attach(unit!); eng.connect(unit!, to: eng.mainMixerNode, format: fmt)
try! eng.enableManualRenderingMode(.offline, format: fmt, maximumFrameCount: 256)
try! eng.start()
let file=try! AVAudioFile(forWriting: URL(fileURLWithPath: outPath), settings: fmt.settings)
let buf=AVAudioPCMBuffer(pcmFormat: eng.manualRenderingFormat, frameCapacity: 256)!
let midi=au.scheduleMIDIEventBlock!
let total=Int((evs.last!.0+4.0)*sr); var pos=0; var k=0
while pos<total {
  let n=AVAudioFrameCount(min(256,total-pos))
  while k<evs.count && Int(evs[k].0*sr) < pos+Int(n) {
    var b=evs[k].1; let off=max(0,Int(evs[k].0*sr)-pos)
    midi(AUEventSampleTimeImmediate+AUEventSampleTime(off),0,b.count,&b); k+=1 }
  let s=try! eng.renderOffline(n, to: buf)
  if s != .success { print("status",s.rawValue) }
  try! file.write(from: buf); pos+=Int(n)
  if pos % Int(sr*2) < 256 { usleep(150000) }   // let disk streaming keep up
}
print("done",outPath)

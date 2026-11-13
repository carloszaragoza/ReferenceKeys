// Usage: dumpstate STATE.xml OUT.xml [wait seconds]
// Loads a state into the Keyscape AU, waits, then writes back the state Keyscape itself serializes.
// Used to upgrade patches extracted from the factory library (older internal format) to the current format.
import AVFoundation
func fourCC(_ s:String)->OSType{ s.utf8.reduce(0){($0<<8)|OSType($1)} }
let args=CommandLine.arguments
let stateXML=try! Data(contentsOf: URL(fileURLWithPath: args[1]))
let wait=args.count>3 ? Double(args[3])! : 15
let desc=AudioComponentDescription(componentType: fourCC("aumu"), componentSubType: fourCC("Kstn"), componentManufacturer: fourCC("GOSW"), componentFlags:0, componentFlagsMask:0)
let sem=DispatchSemaphore(value:0); var unit:AVAudioUnit?
AVAudioUnit.instantiate(with: desc, options: []){u,e in unit=u; if let e=e{print("err",e)}; sem.signal()}
sem.wait()
let au=unit!.auAudioUnit
Thread.sleep(forTimeInterval: 3)
var st=au.fullState!; st["data0"]=stateXML; au.fullState=st
RunLoop.current.run(until: Date().addingTimeInterval(wait))
let back=au.fullState!["data0"] as! Data
try! back.write(to: URL(fileURLWithPath: args[2]))
print("wrote", args[2], back.count)

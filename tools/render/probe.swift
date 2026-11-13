import AVFoundation
let desc=AudioComponentDescription(componentType: fourCC("aumu"), componentSubType: fourCC("Kstn"), componentManufacturer: fourCC("GOSW"), componentFlags:0, componentFlagsMask:0)
func fourCC(_ s:String)->OSType{ s.utf8.reduce(0){($0<<8)|OSType($1)} }
let sem=DispatchSemaphore(value:0)
var unit:AVAudioUnit?
AVAudioUnit.instantiate(with: desc, options: .loadOutOfProcess){u,e in unit=u; if let e=e{print("err",e)}; sem.signal()}
sem.wait()
guard let au=unit?.auAudioUnit else {print("no unit"); exit(1)}
print("loaded", au.audioUnitName ?? "")
Thread.sleep(forTimeInterval: 5)
if let st=au.fullState { for (k,v) in st { if let d=v as? Data { print(k,"Data",d.count); try? d.write(to: URL(fileURLWithPath:"state_\(k).bin")) } else { print(k,v) } } }

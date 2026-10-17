import { FlowerKind } from '../lib/garden';
import Image from 'next/image';

export default function GardenFlower({ kind, stage = 5, familyBud = false, decorative = true }: { kind: FlowerKind; stage?: number; familyBud?: boolean; decorative?: boolean }) {
  return <div className={`garden-flower flower-${kind} growth-${stage}`} aria-hidden={decorative ? true : undefined}>
    <div className="flower-ground" />
    {stage < 4 && <svg key={stage} className="sprout-drawing" viewBox="0 0 240 320" fill="none" aria-hidden="true">
      {stage === 0 ? <><path d="M76 296 Q120 284 166 297" stroke="#a2a88a" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 7" /><path d="M103 297 Q120 290 137 297" stroke="#a2a88a" strokeWidth="2" strokeLinecap="round" /></> : <>
        <path className="growing-stem" d={stage === 1 ? 'M120 294 Q116 273 122 249' : stage === 2 ? 'M120 294 Q108 245 125 193' : 'M120 294 Q107 215 128 140'} stroke="#6c8863" strokeWidth="5" strokeLinecap="round" />
        <path d={stage === 1 ? 'M119 273 C91 273 91 249 100 253 C112 255 122 264 119 273Z' : 'M117 254 C73 256 71 217 85 225 C106 228 121 241 117 254Z'} fill="#92aa79" opacity=".85" />
        <path d={stage === 1 ? 'M121 261 C144 259 147 240 135 245 C127 247 121 253 121 261Z' : 'M120 232 C158 233 171 194 152 205 C135 209 124 218 120 232Z'} fill="#7e9c70" opacity=".8" />
        {stage === 3 && <><path d="M127 151 Q109 133 128 116 Q145 132 127 151" fill={kind === 'calendula' ? '#d8bb71' : '#d8dac2'} stroke="#80966b" strokeWidth="2" /><path d="M127 150 Q123 137 128 126" stroke="#8a9c74" strokeWidth="2" /></>}
      </>}
    </svg>}
    {stage >= 4 && <Image className="flower-botanical" src={`/garden/${kind}.png`} alt="" width={512} height={768} sizes="(max-width: 520px) 170px, 260px" draggable={false} />}
    {familyBud && stage > 0 && <svg className="family-bud" viewBox="0 0 100 130" aria-hidden="true"><path d="M12 125 Q22 66 58 43" fill="none" stroke="#7c9568" strokeWidth="3" /><path d="M57 48 Q38 30 61 15 Q80 36 57 48" fill="#d9ccb2" stroke="#97a17a" strokeWidth="2" /><path d="M22 94 Q47 90 43 73 Q29 74 22 94" fill="#9bad83" /></svg>}
    <span className="petal-light light-one" /><span className="petal-light light-two" />
  </div>;
}

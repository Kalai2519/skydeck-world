// Clip names match typical Mixamo exports; rename your clips or edit this map.
export type AnimState = 'Idle' | 'Walk' | 'Sit_Down' | 'Sitting_Idle' | 'Talking_Gesture' | 'Wave' | 'Poke_Reaction'
const ONE_SHOT: Partial<Record<AnimState, number>> = { Wave: 2.2, Poke_Reaction: 0.9, Sit_Down: 1.1 }
export class AnimationStateMachine {
  state: AnimState = 'Idle'; base: AnimState = 'Idle'; since = 0; lock = 0; seated = false
  get locked() { return this.lock > 0 }
  play(s: AnimState) { this.state = s; this.since = 0; this.lock = ONE_SHOT[s] ?? 0 }
  setBase(s: AnimState) { this.base = s; if (!this.locked && this.state !== s) { this.state = s; this.since = 0 } }
  update(dt: number) {
    this.since += dt
    if (this.lock > 0) { this.lock -= dt; if (this.lock <= 0) { this.lock = 0; this.state = this.base; this.since = 0 } }
  }
}

import { computed, reactive } from '@vue/reactivity'

export type NavbarData = NavbarItem[]

export interface NavbarItem {
  pathExp: string
  title: string
}

export class NavbarRegistry {
  private sections = reactive(new Map<string, NavbarData>())
  public items = computed(() => Array.from(this.sections.values()).flat())

  get(namespace: string): NavbarData {
    if (!this.sections.has(namespace)) {
      this.sections.set(namespace, reactive([]))
    }
    return this.sections.get(namespace)!
  }
}

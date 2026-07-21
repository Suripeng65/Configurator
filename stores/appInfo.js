  import { defineStore } from 'pinia'
  import axios from 'axios'

  export const useAppInfoStore = defineStore('appInfo', {
    state: () => ({
        currentUser: {name: null}
    }),
    actions:{
        async fetchCurrentUser() {
            const { data } = await axios.get('app/getCurrentUser.json')
            this.currentUser = data
            return data
            },
        }
  })

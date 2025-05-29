import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
	{
		path: '/',
		name: 'Generator',
		component: () => import('../views/Generator.vue')
	},
	{
		path: '/configuration',
		name: 'Configuration',
		component: () => import('../views/Configuration.vue')
	},
	{
		path: '/generations',
		name: 'Generations',
		component: () => import('../views/Generations.vue')
	}
]

const router = createRouter({
	history: createWebHashHistory(),
	routes
})

export default router

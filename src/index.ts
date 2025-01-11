import Cleave from 'cleave.js'
import './style.css'

const parseInteger = (v: unknown): number | null => {
	const n = parseFloat(v as any)
	if (Number.isInteger(n)) {
		return n as number
	}
	return null
}

const searchParams = (() => {
	const listeners = new Set<(date: Date | null) => void>()
	const subscribe = (listener: (date: Date | null) => void) => {
		listeners.add(listener)
		return () => {
			listeners.delete(listener)
		}
	}
	const get = (): Date | null => {
		try {
			const url = new URL(window.location.href)
			const inputDate = url.searchParams.get('d')
			const date = new Date(`${inputDate}T12:00:00.000Z`)
			if (!Number.isInteger(date.getTime())) {
				return null
			}

			return date
		} catch {
			return null
		}
	}

	const notify = (value: Date | null) => {
		for (const listener of listeners) {
			listener(value)
		}
	}
	let timeout = setTimeout(() => void 0, 0)
	const scheduleNotification = (value: Date | null) => {
		clearTimeout(timeout)
		setTimeout(notify, 0, value)
	}

	const set = <TDate extends Date | null>(date: TDate): TDate => {
		if (!date) {
			scheduleNotification(date)

			return date
		}
		try {
			const asIso = date.toISOString().split('T')[0]!
			const url = new URL(window.location.href)
			url.searchParams.set('d', asIso)
			history.replaceState(null, '', url.toString())

			scheduleNotification(date)
			return date
		} catch {
			scheduleNotification(date)
			return date
		}
	}

	return { get, set, subscribe }
})()

;(() => {
	const resultBox = document.querySelector('#result')
	const dateInput = document.querySelector('#input')
	if (
		!(dateInput instanceof HTMLInputElement) ||
		!(resultBox instanceof HTMLElement)
	) {
		throw new Error(
			'Seems like js has been loaded before the page elements did',
		)
	}

	const cleave = new Cleave('#input', {
		date: true,
		delimiter: '.',
		datePattern: ['d', 'm', 'Y'],
	})

	const current = searchParams.get()
	resultBox.style.backgroundColor = toColor(current)
	searchParams.subscribe((value) => {
		console.log('value', value)
		resultBox.style.backgroundColor = toColor(value)
	})

	const onChange = () => {
		const date = new Date(cleave.getISOFormatDate())
		if (Number.isFinite(date.getTime())) {
			searchParams.set(date)
		}
	}
	dateInput.addEventListener('input', onChange)
})()

function toColor(date: Date | null) {
	if (!date) {
		return '#fff'
	}

	const measureDate = new Date(date)
	measureDate.setDate(1)
	measureDate.setMonth(measureDate.getMonth() + 1)
	const maxDay = new Date(
		measureDate.getTime() - 1000 * 60 * 60 * 24 - 10,
	).getDate()
	const d = parseInteger(date.getDate()) as number
	const m = parseInteger(date.getMonth() + 1) as number
	const y = parseInteger(date.getFullYear()) as number

	const mc = (m / Number(String(y).slice(-2))) * 100
	const md = (d / maxDay) * 100

	let c =
		mc *
		md *
		[d, m, y].reduce((r, v) => r + v, (d / m) * (d + m + y))

	const hue = c / 360
	let lightess = Math.abs(Math.sin((hue * Math.PI) / 180)) * 80

	let sp = 0
	sp += +String(y).includes(String(d))
	sp += +String(y).includes(String(m))
	sp += +(d % 3 === 0)
	sp += +(m % 2 === 0)
	sp += +(y % 6 === 0)
	const saturation = (sp / 5) * 100
	return `hsl(${hue}, ${saturation}%, ${lightess}%)`
}

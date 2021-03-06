export default {
	async fetch(request) {
		const { searchParams } = new URL(request.url);
		const diva = searchParams.get('diva');

		const departures = await getDepartures(diva);

		return new Response(JSON.stringify(departures), {
			headers: {
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*',
			},
		});
	},
};

async function getDepartures(diva) {
	const apiRes = await fetch('https://www.wienerlinien.at/ogd_realtime/monitor?diva=' + diva);
	const data = await apiRes.json();
	let { monitors } = data.data;
	monitors = monitors.filter((monitor) => monitor.lines.some((line) => line.type === 'ptMetro'));

	const departures = monitors.map((monitor) => {
		const lineDepartures = monitor.lines.map((line) => {
			return line.departures.departure.map((departure) => {
				const { vehicle, departureTime } = departure;
				return {
					countdown: departureTime?.countdown,
					line: vehicle?.name,
					direction: vehicle?.direction,
				};
			});
		});

		return lineDepartures;
	});

	return departures
		.flat(2)
		.filter((dep) => dep.countdown !== undefined && !!dep.line && !!dep.direction)
		.sort((a, b) => a.countdown - b.countdown);
}

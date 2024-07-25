export const dynamicExpand = (init, input) => {
	const result = [];
	const first = [];
	const second = [];
	const third = [];
	const fourth = [];
	const five = [];

	for (let p = 0; p < input.length; p++) {
		var index = input[p];
		var item = init[index];
		if (item !== undefined) {
			switch (p) {
				case 0:
					first.push(...item);
					break;
				case 1:
					second.push(...item);
					break;
				case 2:
					third.push(...item);
					break;
				case 3:
					fourth.push(...item);
					break;
				case 4:
					five.push(...item);
					break;
				default:
			}
		}
	}

	for (var i = 0; i < first.length; i++) {
		result.push(first[i]);
		for (var j = 0; j < second.length; j++) {
			result.push(first[i] + '|' + second[j]);
			for (var k = 0; k < third.length; k++) {
				result.push(first[i] + '|' + second[j] + '|' + third[k]);
				for (var m = 0; m < fourth.length; m++) {
					result.push(first[i] + '|' + second[j] + '|' + third[k] + '|' + fourth[m]);
					for (var n = 0; n < five.length; n++) {
						result.push(first[i] + '|' + second[j] + '|' + third[k] + '|' + fourth[m] + '|' + five[n]);
					}
				}
			}
		}
	}

	return result;
}

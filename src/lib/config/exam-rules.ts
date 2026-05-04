/**
 * Class → Allowed Exam Terms mapping.
 *
 * Class V–IX (IDs 5–9): 1st Term(1), 2nd Term(2), Annual Exam(3)
 * Class X   (ID 10):    1st Term(1), Pre-Test(4), Test(5), Special Test-I(6), Special Test-II(7)
 */
export const ALLOWED_TERM_IDS: Record<number, number[]> = {
	5: [1, 2, 3],
	6: [1, 2, 3],
	7: [1, 2, 3],
	8: [1, 2, 3],
	9: [1, 2, 3],
	10: [1, 4, 5, 6, 7]
};

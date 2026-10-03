package entity

import "testing"

func TestSalaryDetailNormalizeUnit(t *testing.T) {
	cases := []struct {
		in, want string
	}{
		{"", SalaryUnitJam},
		{"Jam", SalaryUnitJam},
		{"Trip", SalaryUnitTrip},
		{"Hari", SalaryUnitHari},
		{"trip", SalaryUnitTrip},
		{"hari", SalaryUnitHari},
		{"jam", SalaryUnitJam},
		{"hour", SalaryUnitJam},
		{"day", SalaryUnitHari},
		{"bogus", SalaryUnitJam},
	}
	for _, c := range cases {
		d := SalaryDetail{Unit: c.in}
		if got := d.NormalizeUnit(); got != c.want {
			t.Errorf("NormalizeUnit(%q) = %q, want %q", c.in, got, c.want)
		}
	}
}

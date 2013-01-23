import sys
from trueskill import *

r1 = Rating(float(sys.argv[1]), float(sys.argv[2]))
r2 = Rating(float(sys.argv[3]), float(sys.argv[4]))
r3 = Rating(float(sys.argv[5]), float(sys.argv[6]))
r4 = Rating(float(sys.argv[7]), float(sys.argv[8]))

t1 = [r1, r2]
t2 = [r3, r4]

#print r1
#print r2
#print r3
#print r4
#print '{:.1%} chance to draw'.format(quality([t1, t2]))

(new_r1, new_r2), (new_r3, new_r4) = rate([t1, t2], ranks=[0,1])

print '{"r1":{"mu":%s, "sigma":%s},"r2":{"mu":%s, "sigma":%s},"r3":{"mu":%s, "sigma":%s},"r4":{"mu":%s, "sigma":%s}}' % (new_r1.mu, new_r1.sigma, new_r2.mu, new_r2.sigma, new_r3.mu, new_r3.sigma, new_r4.mu, new_r4.sigma)
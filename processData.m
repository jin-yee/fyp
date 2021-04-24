close all
figure()
histogram(test,'BinWidth', 0.5, 'Normalization', 'probability')
title('Probability of PFD')
xlabel('Power flux Density (dB(W/m^2 BW_{ref})')
ylabel('Probability (# of occurance / Total record)')

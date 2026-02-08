import fetch from 'node-fetch';

const checkTranslation = async () => {
  try {
    const response = await fetch('http://localhost:5001/api/translations');
    const data = await response.json();
    
    console.log('\n=== Translation Status for common.viewMore ===');
    console.log('English (en):', data.en?.common?.viewMore || 'NOT FOUND');
    console.log('Armenian (hy):', data.hy?.common?.viewMore || 'NOT FOUND');
    console.log('Russian (ru):', data.ru?.common?.viewMore || 'NOT FOUND');
    
    console.log('\n=== What you expected in Armenian ===');
    console.log('Expected: կապ մեզ հետ');
    console.log('Actual:  ', data.hy?.common?.viewMore || 'NOT FOUND');
    console.log('Match:', data.hy?.common?.viewMore === 'կապ մեզ հետ' ? '✅ YES' : '❌ NO');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
};

checkTranslation();

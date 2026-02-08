import fetch from 'node-fetch';

const updateTranslation = async () => {
  try {
    const response = await fetch('http://localhost:5001/api/translations/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: 'hy',
        updates: {
          'common.viewMore': 'կապ մեզ հետ'
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    const result = await response.json();
    console.log('✅ Update successful:', result);
    
    // Verify the change
    const checkResponse = await fetch('http://localhost:5001/api/translations');
    const data = await checkResponse.json();
    console.log('\n📋 Current value:', data.hy?.common?.viewMore);
    console.log('Expected: կապ մեզ հետ');
    console.log('Match:', data.hy?.common?.viewMore === 'կապ մեզ հետ' ? '✅ YES' : '❌ NO');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

updateTranslation();

const dateString1 = "2024-12-26"; 
const dateString2="2024-11-01"
function formatDate(dateString){
  if (!dateString) return null;
  const d = new Date(dateString);
  const year = d.getFullYear();
  const month = String(d.getMonth()+1).padStart(2, '0'); // Add leading zero
  const day = String(d.getDate()).padStart(2, '0'); // Add leading zero
  return `${year}-${month}-${day}`; // Format as YYYY-MM-DD

}
// formatDate(dateString1)
// // Format date fields to 'YYYY-MM-DD'
// const formatDate = (date) => date.toISOString().split('T')[0];

function formatDateGCtoEC(dateString) {
    if (!dateString) return null;
    // console.log("Input date string: ", dateString);
    const gregorianDate = new Date(dateString);
    let gYear = gregorianDate.getFullYear();
    let gMonth = gregorianDate.getMonth() + 1;
    let gDay = gregorianDate.getDate();
  
    // Calculate Ethiopian year
    let eYear = gMonth >= 9 ? gYear - 7 : gYear - 8;
  
    let eMonth, eDay;
  
    if (gMonth === 1) {
      if (eYear % 4 === 0) {
        if (gDay < 10) {
          eMonth = 13;
          eDay = gDay + 21; // (31 - 10)
        } else {
          eMonth = 1;
          eDay = gDay - 9;
        }
      } else {
        if (gDay < 9) {
          eMonth = 13;
          eDay = gDay + 22; // (31 - 9)
        } else {
          eMonth = 1;
          eDay = gDay - 8;
        }
      }
    } else if (gMonth === 2) {
      if (eYear % 4 === 0) {
        if (gDay < 10) {
          eMonth = 1;
          eDay = gDay + 22; // (31 - 9)
        } else {
          eMonth = 2;
          eDay = gDay - 8;
        }
      } else {
        if (gDay < 8) {
          eMonth = 1;
          eDay = gDay + 23; // (31 - 8)
        } else {
          eMonth = 2;
          eDay = gDay - 7;
        }
      }
    } else if (gMonth === 3) {
      if (gDay < 10) {
        eMonth = 2;
        eDay = gDay + 21; // (29 - 8)
      } else {
        eMonth = 3;
        eDay = gDay - 9;
      }
    } else if (gMonth === 4) {
      if (gDay < 9) {
        eMonth = 3;
        eDay = gDay + 22; // (30 - 8)
      } else {
        eMonth = 4;
        eDay = gDay - 8;
      }
    } else if (gMonth === 5) {
      if (gDay < 9) {
        eMonth = 4;
        eDay = gDay + 22; // (30 - 8)
      } else {
        eMonth = 5;
        eDay = gDay - 8;
      }
    } else if (gMonth === 6) {
      if (gDay < 8) {
        eMonth = 5;
        eDay = gDay + 23; // (31 - 8)
      } else {
        eMonth = 6;
        eDay = gDay - 7;
      }
    } else if (gMonth === 7) {
      if (gDay < 8) {
        eMonth = 6;
        eDay = gDay + 22; // (30 - 7)
      } else {
        eMonth = 7;
        eDay = gDay - 7;
      }
    } else if (gMonth === 8) {
      if (gDay < 7) {
        eMonth = 7;
        eDay = gDay + 24; // (31 - 7)
      } else {
        eMonth = 8;
        eDay = gDay - 6;
      }
    } else if (gMonth === 9) {
      if (eYear % 4 === 0) {
        if (gYear % 4 === 0) {
          if (gDay < 6) {
            eMonth = 8;
            eDay = gDay + 25; // (31 - 6)
          } else {
            if (gDay < 12) {
              eMonth = 13;
              eDay = gDay - 5;
            } else {
              eMonth = 1;
              eDay = gDay - 10;
            }
          }
        } else {
          if (gDay < 6) {
            eMonth = 8;
            eDay = gDay + 24; // (31 - 7)
          } else {
            if (gDay < 12) {
              eMonth = 13;
              eDay = gDay - 6;
            } else {
              eMonth = 1;
              eDay = gDay - 10;
            }
          }
        }
      } else {
        if (gDay < 5) {
          eMonth = 8;
          eDay = gDay + 26; // (31 - 5)
        } else {
          if (gDay < 11) {
            eMonth = 13;
            eDay = gDay - 4;
          } else {
            eMonth = 1;
            eDay = gDay - 10;
          }
        }
      }
    } else if (gMonth === 10) {
      if (eYear % 4 === 0) {
        if (gDay < 12) {
          eMonth = 1;
          eDay = gDay + 19; // (30 - 11)
        } else {
          eMonth = 2;
          eDay = gDay - 11;
        }
      } else {
        if (gDay < 11) {
          eMonth = 1;
          eDay = gDay + 20; // (30 - 10)
        } else {
          eMonth = 2;
          eDay = gDay - 10;
        }
      }
    } else if (gMonth === 11) {
      if (eYear % 4 === 0) {
        if (gDay < 11) {
          eMonth = 2;
          eDay = gDay + 20; // (31 - 11)
        } else {
          eMonth = 3;
          eDay = gDay - 10;
        }
      } else {
        if (gDay < 10) {
          eMonth = 2;
          eDay = gDay + 21; // (31 - 10)
        } else {
          eMonth = 3;
          eDay = gDay - 9;
        }
      }
    } else if (gMonth === 12) {
      if (eYear % 4 === 0) {
        if (gDay < 11) {
          eMonth = 3;
          eDay = gDay + 19; // (30 - 11)
        } else {
          eMonth = 4;
          eDay = gDay - 10;
        }
      } else {
        if (gDay < 10) {
          eMonth = 3;
          eDay = gDay + 20; // (30 - 10)
        } else {
          eMonth = 4;
          eDay = gDay - 9;
        }
      }
    }
  
    // console.log(`Ethiopian Date: ${eYear}-${eMonth}-${eDay}`);
    return `${eYear}-${String(eMonth).padStart(2, '0')}-${String(eDay).padStart(2, '0')}`;
  }
// formatDate(dateString1);
// formatDate(dateString2);

module.exports = {
  formatDate,formatDateGCtoEC
};


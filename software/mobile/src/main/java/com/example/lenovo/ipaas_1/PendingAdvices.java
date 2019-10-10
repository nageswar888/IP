package com.example.lenovo.ipaas_1;

import android.content.Intent;
import android.os.Bundle;
import android.support.design.widget.FloatingActionButton;
import android.support.design.widget.Snackbar;
import android.support.v7.app.AppCompatActivity;
import android.support.v7.widget.Toolbar;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ListView;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;

public class PendingAdvices extends AppCompatActivity {
    ListView adviceList;
    public static ArrayList<AdviceObject> arrayList;
    String adviceStatus;
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_pending_advices);
        Toolbar toolbar = (Toolbar) findViewById(R.id.toolbar);
        toolbar.setTitle("iPaas");
        if(getSupportActionBar() != null){
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
        }

        setSupportActionBar(toolbar);
        adviceList = (ListView)findViewById(R.id.listView);
        Intent intent = getIntent();
        final String jsonObjectResponse = intent.getStringExtra("jsonString");

        adviceStatus = intent.getStringExtra("adviceStatus");

        parseJson(jsonObjectResponse);
        ListViewAdapter adapter = new ListViewAdapter(PendingAdvices.this, arrayList); //add the pending advices to adapter with two columns
        adviceList.setAdapter(adapter);
        //on cliking an advice from the listview open the details of advice in other activity
        adviceList.setOnItemClickListener(new AdapterView.OnItemClickListener() {
            @Override
            public void onItemClick(AdapterView<?> parent, View view, int position, long id) {
                Intent intent = new Intent(getApplicationContext(), ShowAdvice.class);
                intent.putExtra("position", position);
                intent.putExtra("jsonString", jsonObjectResponse);
                startActivity(intent);
            }
        });

    }
    public void parseJson(String jsonObjectResponse)
    {
        arrayList = new ArrayList<AdviceObject>();
        System.out.println("jsonObject intent&&&&&&&&&& "+jsonObjectResponse+" advices status "+adviceStatus);
        JSONObject jsonObject = null;
        try {
            jsonObject = new JSONObject(jsonObjectResponse);
                System.out.println("(9999999999999999999999999999 "+jsonObject);
                JSONArray jsonArray = (JSONArray) jsonObject.get("data");
                for(int i=0;i<jsonArray.length();i++)
                {
                    JSONObject jobject = jsonArray.getJSONObject(i);

                    if(jobject.get("adviceStatus").equals(adviceStatus))
                    {
                        JSONObject jsonChildObject = null;
                        try {
                            jsonChildObject = (JSONObject)jobject.get("payee");

                            if(jsonChildObject != null){
                                AdviceObject adviceObject = new AdviceObject();

                                adviceObject.setName((String) jsonChildObject.get("name"));
                                System.out.println("PPPPPPPPPPPPPPPPPPPPPPPP reqAm " + jobject.get("requestedAmount"));
                                adviceObject.setAmount((int)jobject.get("requestedAmount"));
                                adviceObject.setJSONObject(jobject);
                                arrayList.add(adviceObject);
                            }


                        }
                        catch (JSONException e) {
                            e.printStackTrace();
                        }
                        catch (NullPointerException e)
                        {
                            e.printStackTrace();
                        }
                    }
                }

        } catch(JSONException e) {
            e.printStackTrace();
        }

    }
}
